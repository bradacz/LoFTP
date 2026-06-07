import { useState, useCallback } from "react";
import { fsDelete, fsMkdir, fsRename } from "@/lib/tauri";
import { FileItem, HostingConfig, HostingProtocol } from "@/types/ftp";
import type { DeleteProgressController } from "@/hooks/useDeleteProgress";
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
  const inactive = activePanel === "left" ? rightPanel : leftPanel;

  const isRemote = active.mode === "remote";
  const isConnected = !!activeHost && connection.getStatus(activeHost.id) === "connected";

  // --- Rename ---
  const rename = useCallback(() => {
    if (active.selection.selected.size !== 1) return;
    if (isRemote && activeHost?.protocol === "bunnyStorage") return;
    const oldName = Array.from(active.selection.selected)[0];
    setPendingAction({ type: "rename", oldName });
  }, [active.selection.selected, activeHost?.protocol, isRemote]);

  const confirmRename = useCallback(async (newName: string) => {
    if (pendingAction?.type !== "rename") return;
    const oldName = pendingAction.oldName;
    setPendingAction(null);
    if (newName === oldName) return;

    try {
      if (isRemote && activeHost && isConnected) {
        if (activeHost.protocol === "bunnyStorage") return;
        await connection.renameRemote(
          activeHost.id,
          `${active.path}/${oldName}`,
          `${active.path}/${newName}`,
          activeHost.protocol
        );
      } else {
        await fsRename(`${active.path}/${oldName}`, `${active.path}/${newName}`);
      }
      active.selection.clear();
      active.refresh();
    } catch (e) {
      console.error("Rename failed:", e);
    }
  }, [pendingAction, isRemote, activeHost, isConnected, connection, active]);

  // --- Create Folder ---
  const createFolder = useCallback(() => {
    setPendingAction({ type: "mkdir" });
  }, []);

  const confirmCreateFolder = useCallback(async (name: string) => {
    setPendingAction(null);
    try {
      if (isRemote && activeHost && isConnected) {
        await connection.mkdirRemote(activeHost.id, `${active.path}/${name}`, activeHost.protocol);
      } else {
        await fsMkdir(`${active.path}/${name}`);
      }
      active.refresh();
    } catch (e) {
      console.error("Mkdir failed:", e);
    }
  }, [isRemote, activeHost, isConnected, connection, active]);

  // --- Delete ---
  const remove = useCallback(() => {
    const names = Array.from(active.selection.selected).filter((name) => name !== "..");
    if (names.length === 0) return;
    const targets = names.map((name) => ({
      name,
      path: `${active.path}/${name}`,
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
  }, [active.selection.selected, active.files, active.path, active.mode, activePanel, activeHost?.id, activeHost?.protocol, deleteProgress, isRemote]);

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

    for (const target of pendingAction.targets) {
      deleteProgress?.step({
        id: deleteId,
        currentPath: target.path,
        currentName: target.name,
        completedItems,
      });

      try {
        if (pendingAction.mode === "remote") {
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
        } else {
          await fsDelete(target.path);
        }
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
    panel.selection.clear();
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
    hasSelection: active.selection.selected.size > 0,
    resolveActiveItem: (name: string) => active.files.find((file) => file.name === name),
    resolveInactiveItem: (name: string) => inactive.files.find((file) => file.name === name),
  };
}
