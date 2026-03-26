import { useState, useCallback } from "react";
import { fsDelete, fsMkdir, fsRename } from "@/lib/tauri";
import { FileItem, HostingConfig } from "@/types/ftp";

type Protocol = "ftp" | "sftp";
type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface ConnectionLike {
  getStatus: (id: string) => ConnectionStatus;
  renameRemote: (hostingId: string, from: string, to: string, protocol: Protocol) => Promise<void>;
  mkdirRemote: (hostingId: string, path: string, protocol: Protocol) => Promise<void>;
  deleteRemote: (hostingId: string, path: string, isDir: boolean, protocol: Protocol) => Promise<void>;
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
}

type PendingAction =
  | { type: "rename"; oldName: string }
  | { type: "mkdir" }
  | { type: "delete"; count: number };

export function useFileActions({
  connection,
  activeHost,
  activePanel,
  leftPanel,
  rightPanel,
}: UseFileActionsParams) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const active = activePanel === "left" ? leftPanel : rightPanel;
  const inactive = activePanel === "left" ? rightPanel : leftPanel;

  const isRemote = active.mode === "remote";
  const isConnected = !!activeHost && connection.getStatus(activeHost.id) === "connected";

  // --- Rename ---
  const rename = useCallback(() => {
    if (active.selection.selected.size !== 1) return;
    const oldName = Array.from(active.selection.selected)[0];
    setPendingAction({ type: "rename", oldName });
  }, [active.selection.selected]);

  const confirmRename = useCallback(async (newName: string) => {
    if (pendingAction?.type !== "rename") return;
    const oldName = pendingAction.oldName;
    setPendingAction(null);
    if (newName === oldName) return;

    try {
      if (isRemote && activeHost && isConnected) {
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
    if (active.selection.selected.size === 0) return;
    setPendingAction({ type: "delete", count: active.selection.selected.size });
  }, [active.selection.selected]);

  const confirmDelete = useCallback(async () => {
    setPendingAction(null);
    for (const name of active.selection.selected) {
      try {
        if (isRemote && activeHost && isConnected) {
          const file = active.files.find((f) => f.name === name);
          await connection.deleteRemote(
            activeHost.id,
            `${active.path}/${name}`,
            file?.isDirectory ?? false,
            activeHost.protocol
          );
        } else {
          await fsDelete(`${active.path}/${name}`);
        }
      } catch (e) {
        console.error(`Delete ${name} failed:`, e);
      }
    }
    active.selection.clear();
    active.refresh();
  }, [isRemote, activeHost, isConnected, connection, active]);

  const cancelAction = useCallback(() => {
    setPendingAction(null);
  }, []);

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
