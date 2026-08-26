import { useState, useCallback } from "react";
import { fsDeleteMany, fsMkdir, fsRename } from "@/lib/tauri";
import { FileItem, HostingConfig, HostingProtocol } from "@/types/ftp";
import type { DeleteProgressController } from "@/hooks/useDeleteProgress";
import { joinPath, validateEntryName } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface ConnectionLike {
  getStatus: (id: string) => ConnectionStatus;
  renameRemote: (hostingId: string, from: string, to: string, protocol: HostingProtocol) => Promise<void>;
  mkdirRemote: (hostingId: string, path: string, protocol: HostingProtocol) => Promise<void>;
  deleteRemote: (hostingId: string, path: string, isDir: boolean, protocol: HostingProtocol, deleteId?: string) => Promise<void>;
}

interface SelectionLike {
  selected: Set<string>;
  clear: () => void;
}

interface PanelData {
  mode: "local" | "remote";
  path: string;
  isArchiveView?: boolean;
  files: FileItem[];
  selection: SelectionLike;
  navigate: (path: string) => void;
  refresh: () => void;
}

interface UseFileActionsParams {
  connection: ConnectionLike;
  activeHost?: HostingConfig;
  activePanel: "left" | "right";
  leftPanel: PanelData;
  rightPanel: PanelData;
  deleteProgress?: DeleteProgressController;
  remoteNotConnectedMessage?: string;
}

type PendingAction =
  | { type: "rename"; oldName: string }
  | { type: "mkdir" }
  | {
      type: "delete";
      count: number;
      panel: "left" | "right";
      mode: "local" | "remote";
      path: string;
      targets: Array<{ name: string; path: string; isDirectory: boolean }>;
      remoteHostingId?: string;
      remoteProtocol?: HostingProtocol;
    };

export function useFileActions({
  connection,
  activeHost,
  activePanel,
  leftPanel,
  rightPanel,
  deleteProgress,
  remoteNotConnectedMessage = "Remote is not connected.",
}: UseFileActionsParams) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const active = activePanel === "left" ? leftPanel : rightPanel;
  const isRemote = active.mode === "remote";
  const isArchiveView = active.mode === "local" && active.isArchiveView;
  const isConnected = !!activeHost && connection.getStatus(activeHost.id) === "connected";

  // --- Rename ---
  const rename = useCallback(() => {
    if (isArchiveView) return;
    if (active.selection.selected.size !== 1) return;
    if (isRemote && activeHost?.protocol === "bunnyStorage") return;
    const oldName = Array.from(active.selection.selected)[0];
    setPendingAction({ type: "rename", oldName });
  }, [active.selection.selected, activeHost?.protocol, isArchiveView, isRemote]);

  const confirmRename = useCallback(async (newName: string) => {
    if (pendingAction?.type !== "rename") return;
    const oldName = pendingAction.oldName;

    try {
      const safeName = validateEntryName(newName);
      if (safeName === oldName) {
        setPendingAction(null);
        return;
      }
      if (isRemote) {
        if (!activeHost || !isConnected) throw new Error(remoteNotConnectedMessage);
        if (activeHost.protocol === "bunnyStorage") throw new Error("Bunny Storage does not support rename.");
        await connection.renameRemote(
          activeHost.id,
          joinPath(active.path, oldName),
          joinPath(active.path, safeName),
          activeHost.protocol
        );
      } else {
        await fsRename(joinPath(active.path, oldName), joinPath(active.path, safeName));
      }
      setPendingAction(null);
      active.selection.clear();
      active.refresh();
    } catch (e) {
      console.error("Rename failed:", e);
      toast.error("Rename failed", { description: String(e) });
    }
  }, [pendingAction, isRemote, activeHost, isConnected, connection, active, remoteNotConnectedMessage]);

  // --- Create Folder ---
  const createFolder = useCallback(() => {
    if (isArchiveView) return;
    setPendingAction({ type: "mkdir" });
  }, [isArchiveView]);

  const confirmCreateFolder = useCallback(async (name: string) => {
    try {
      const safeName = validateEntryName(name);
      if (isRemote) {
        if (!activeHost || !isConnected) throw new Error(remoteNotConnectedMessage);
        await connection.mkdirRemote(activeHost.id, joinPath(active.path, safeName), activeHost.protocol);
      } else {
        await fsMkdir(joinPath(active.path, safeName));
      }
      setPendingAction(null);
      active.refresh();
    } catch (e) {
      console.error("Mkdir failed:", e);
      toast.error("Create folder failed", { description: String(e) });
    }
  }, [isRemote, activeHost, isConnected, connection, active, remoteNotConnectedMessage]);

  // --- Delete ---
  const remove = useCallback(() => {
    if (isArchiveView) return;
    const validNames = new Set(active.files.filter((file) => file.name !== "..").map((file) => file.name));
    const names = Array.from(active.selection.selected).filter((name) => validNames.has(name));
    if (names.length === 0) {
      active.selection.clear();
      return;
    }
    const targets = names.map((name) => ({
      name,
      path: joinPath(active.path, name),
      isDirectory: active.files.find((file) => file.name === name)?.isDirectory ?? false,
    }));
    deleteProgress?.clear();
    setPendingAction({
      type: "delete",
      count: targets.length,
      panel: activePanel,
      mode: active.mode,
      path: active.path,
      targets,
      remoteHostingId: isRemote ? activeHost?.id : undefined,
      remoteProtocol: isRemote ? activeHost?.protocol : undefined,
    });
  }, [active.selection, active.files, active.path, active.mode, activePanel, activeHost?.id, activeHost?.protocol, deleteProgress, isArchiveView, isRemote]);

  const confirmDelete = useCallback(async () => {
    if (pendingAction?.type !== "delete") return;
    if (pendingAction.targets.length === 0) {
      setPendingAction(null);
      return;
    }

    const deleteId = crypto.randomUUID();
    deleteProgress?.begin({
      id: deleteId,
      mode: pendingAction.mode,
      rootPath: pendingAction.path,
      totalItems: pendingAction.targets.length,
    });

    let completedItems = 0;
    const errors: string[] = [];

    if (pendingAction.mode === "local") {
      deleteProgress?.step({
        id: deleteId,
        currentPath: pendingAction.path,
        currentName: pendingAction.path,
        completedItems: 0,
      });

      try {
        await fsDeleteMany(pendingAction.targets.map((target) => target.path), deleteId);
        completedItems = pendingAction.targets.length;
        deleteProgress?.finish({ id: deleteId, completedItems });
        setPendingAction(null);
      } catch (e) {
        console.error("Delete failed:", e);
        deleteProgress?.fail({ id: deleteId, error: String(e) });
      }

      const panel = pendingAction.panel === "left" ? leftPanel : rightPanel;
      if (completedItems === pendingAction.targets.length) panel.selection.clear();
      panel.refresh();
      return;
    }

    for (const target of pendingAction.targets) {
      deleteProgress?.step({
        id: deleteId,
        currentPath: target.path,
        currentName: target.name,
        completedItems,
      });

      try {
        if (!pendingAction.remoteHostingId || !pendingAction.remoteProtocol || connection.getStatus(pendingAction.remoteHostingId) !== "connected") {
          throw new Error(remoteNotConnectedMessage);
        }
        await connection.deleteRemote(
          pendingAction.remoteHostingId,
          target.path,
          target.isDirectory,
          pendingAction.remoteProtocol,
          deleteId
        );
        completedItems += 1;
        deleteProgress?.step({
          id: deleteId,
          currentPath: target.path,
          currentName: target.name,
          completedItems,
        });
      } catch (e) {
        console.error(`Delete ${target.name} failed:`, e);
        errors.push(String(e));
      }
    }

    if (errors.length > 0) {
      deleteProgress?.fail({ id: deleteId, error: errors[0] });
    } else {
      deleteProgress?.finish({ id: deleteId, completedItems });
      setPendingAction(null);
    }

    const panel = pendingAction.panel === "left" ? leftPanel : rightPanel;
    if (errors.length === 0) panel.selection.clear();
    panel.refresh();
  }, [pendingAction, connection, leftPanel, rightPanel, deleteProgress, remoteNotConnectedMessage]);

  const cancelAction = useCallback(() => {
    deleteProgress?.clear();
    setPendingAction(null);
  }, [deleteProgress]);

  // --- Refresh ---
  const refresh = useCallback(() => {
    leftPanel.refresh();
    rightPanel.refresh();
  }, [leftPanel, rightPanel]);

  return {
    rename,
    createFolder,
    remove,
    refresh,
    confirmRename,
    confirmCreateFolder,
    confirmDelete,
    cancelAction,
    pendingAction,
    hasSelection: active.files.some((file) => file.name !== ".." && active.selection.selected.has(file.name)),
  };
}
