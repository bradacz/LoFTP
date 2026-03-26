import { useCallback, useState } from "react";
import { TransferOptions } from "@/components/ftp/TransferDialog";
import { archiveExtract, TransferOptionsPayload, fsCopy, fsCopyDir } from "@/lib/tauri";
import { HostingConfig, FileItem } from "@/types/ftp";

interface FileResolver {
  resolveActiveItem: (name: string) => FileItem | undefined;
  resolveInactiveItem: (name: string) => FileItem | undefined;
}

interface TransferStarter {
  startUpload: (
    files: { name: string; localPath: string; isDirectory?: boolean }[],
    remotePath: string,
    hostingId: string,
    protocol: "ftp" | "sftp",
    options?: TransferOptionsPayload,
  ) => Promise<void>;
  startDownload: (
    files: { name: string; remotePath: string; isDirectory?: boolean }[],
    localPath: string,
    hostingId: string,
    protocol: "ftp" | "sftp",
    options?: TransferOptionsPayload,
  ) => Promise<void>;
}

interface PanelInfo {
  mode: "local" | "remote";
  path: string;
  isArchiveView?: boolean;
  archivePath?: string | null;
  selection: { selected: Set<string>; clear: () => void };
  refresh: () => void;
}

interface UseTransferOrchestrationParams {
  activeHost?: HostingConfig;
  activePanel: "left" | "right";
  leftPanel: PanelInfo;
  rightPanel: PanelInfo;
  transfers: TransferStarter;
  fileResolver: FileResolver;
}

interface PendingTransfer {
  files: string[];
  from: string;
  to: string;
  direction: "upload" | "download" | "local-copy" | "archive-extract";
}

function toTransferPayload(options: TransferOptions): TransferOptionsPayload {
  return {
    mode: options.mode,
    overwrite: options.overwrite,
    resume: options.resume,
    preserveTimestamps: options.preserveTimestamps,
    preservePermissions: options.preservePermissions,
    followSymlinks: options.followSymlinks,
    createDirs: options.createDirs,
    verifyAfterTransfer: options.verifyAfterTransfer,
  };
}

export function useTransferOrchestration({
  activeHost,
  activePanel,
  leftPanel,
  rightPanel,
  transfers,
  fileResolver,
}: UseTransferOrchestrationParams) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  const source = activePanel === "left" ? leftPanel : rightPanel;
  const target = activePanel === "left" ? rightPanel : leftPanel;

  const queueTransfer = useCallback((files: string[], from: string, to: string, direction: PendingTransfer["direction"]) => {
    if (files.length === 0) return;
    setPendingTransfer({ files, from, to, direction });
    setDialogOpen(true);
  }, []);

  // F5 Copy: from active panel to inactive panel
  const copy = useCallback(() => {
    const selectedFiles = Array.from(source.selection.selected).filter((n) => n !== "..");
    if (selectedFiles.length === 0) return;

    let direction: PendingTransfer["direction"];
    if (source.mode === "local" && source.isArchiveView) {
      if (target.mode !== "local" || target.isArchiveView) return;
      direction = "archive-extract";
    } else if (source.mode === "local" && target.mode === "local") {
      if (target.isArchiveView) return;
      direction = "local-copy";
    } else if (source.mode === "local" && target.mode === "remote") {
      direction = "upload";
    } else {
      direction = "download";
    }

    queueTransfer(selectedFiles, source.path, target.path, direction);
  }, [source, target, queueTransfer]);

  const dropOnPanel = useCallback((panelSide: "left" | "right", fileNames: string[]) => {
    const dropTarget = panelSide === "left" ? leftPanel : rightPanel;
    const dropSource = panelSide === "left" ? rightPanel : leftPanel;
    const files = fileNames.filter((n) => n !== "..");
    if (files.length === 0) return;

    let direction: PendingTransfer["direction"];
    if (dropSource.mode === "local" && dropSource.isArchiveView) {
      if (dropTarget.mode !== "local" || dropTarget.isArchiveView) return;
      direction = "archive-extract";
    } else if (dropSource.mode === "local" && dropTarget.mode === "local") {
      if (dropTarget.isArchiveView) return;
      direction = "local-copy";
    } else if (dropSource.mode === "local" && dropTarget.mode === "remote") {
      direction = "upload";
    } else {
      direction = "download";
    }

    queueTransfer(files, dropSource.path, dropTarget.path, direction);
  }, [leftPanel, rightPanel, queueTransfer]);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setPendingTransfer(null);
    setIsTransferring(false);
  }, []);

  const confirm = useCallback(async (options: TransferOptions) => {
    if (!pendingTransfer) return;
    const payload = toTransferPayload(options);

    if (pendingTransfer.direction === "local-copy") {
      // Local-to-local filesystem copy
      for (const name of pendingTransfer.files) {
        const item = fileResolver.resolveActiveItem(name);
        const srcPath = `${pendingTransfer.from}/${name}`;
        const dstPath = `${pendingTransfer.to}/${name}`;
        try {
          if (item?.isDirectory) {
            await fsCopyDir(srcPath, dstPath);
          } else {
            await fsCopy(srcPath, dstPath);
          }
        } catch (e) {
          console.error(`Local copy ${name} failed:`, e);
        }
      }
      source.selection.clear();
      // Refresh the target panel
      target.refresh();
      closeDialog();
      return;
    }

    if (pendingTransfer.direction === "archive-extract") {
      if (!source.archivePath) return;
      const entryPaths = pendingTransfer.files
        .map((name) => fileResolver.resolveActiveItem(name)?.entryPath)
        .filter((path): path is string => !!path);

      if (entryPaths.length === 0) {
        closeDialog();
        return;
      }

      await archiveExtract(source.archivePath, pendingTransfer.to, entryPaths);
      source.selection.clear();
      target.refresh();
      closeDialog();
      return;
    }

    if (!activeHost) return;

    // Switch dialog to progress mode (don't close)
    setIsTransferring(true);

    // Fire-and-forget: don't await — let transfers run in background
    // so the UI stays responsive and shows progress immediately
    if (pendingTransfer.direction === "upload") {
      const fileData = pendingTransfer.files.map((name) => ({
        name,
        localPath: `${pendingTransfer.from}/${name}`,
        isDirectory: fileResolver.resolveActiveItem(name)?.isDirectory ?? false,
      }));

      transfers.startUpload(fileData, pendingTransfer.to, activeHost.id, activeHost.protocol, payload)
        .then(() => { source.selection.clear(); target.refresh(); });
    } else {
      const fileData = pendingTransfer.files.map((name) => ({
        name,
        remotePath: `${pendingTransfer.from}/${name}`,
        isDirectory: fileResolver.resolveActiveItem(name)?.isDirectory ?? false,
      }));

      transfers.startDownload(fileData, pendingTransfer.to, activeHost.id, activeHost.protocol, payload)
        .then(() => { source.selection.clear(); target.refresh(); });
    }
    // Dialog stays open — auto-closes via TransferDialog useEffect when done
  }, [
    activeHost,
    closeDialog,
    fileResolver,
    pendingTransfer,
    source,
    target,
    transfers,
  ]);

  return {
    transferDialogOpen: dialogOpen,
    pendingTransfer,
    isTransferring,
    copy,
    dropOnPanel,
    closeDialog,
    confirm,
  };
}
