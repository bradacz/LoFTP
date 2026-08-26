import { useCallback, useState } from "react";
import { TransferOptions } from "@/components/ftp/TransferDialog";
import {
  archiveExtract,
  TransferOptionsPayload,
  fsCopy,
  fsCopyDir,
  fsGetTempDir,
  fsMkdir,
  fsRemove,
} from "@/lib/tauri";
import { HostingConfig, FileItem, HostingProtocol } from "@/types/ftp";
import { joinPath } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";

interface TransferStarter {
  startUpload: (
    files: { name: string; localPath: string; isDirectory?: boolean }[],
    remotePath: string,
    hostingId: string,
    protocol: HostingProtocol,
    options?: TransferOptionsPayload,
  ) => Promise<boolean>;
  startDownload: (
    files: { name: string; remotePath: string; isDirectory?: boolean }[],
    localPath: string,
    hostingId: string,
    protocol: HostingProtocol,
    options?: TransferOptionsPayload,
  ) => Promise<boolean>;
  resetForTransfer: () => void;
}

interface ConnectionLike {
  getStatus: (id: string) => "disconnected" | "connecting" | "connected" | "error";
  deleteRemote: (hostingId: string, path: string, isDir: boolean, protocol: HostingProtocol, deleteId?: string) => Promise<void>;
}

interface PanelInfo {
  mode: "local" | "remote";
  path: string;
  files: FileItem[];
  isArchiveView?: boolean;
  archivePath?: string | null;
  archiveInnerPath?: string | null;
  selection: { selected: Set<string>; clear: () => void };
  refresh: () => void;
}

interface UseTransferOrchestrationParams {
  connection: ConnectionLike;
  activeHost?: HostingConfig;
  activePanel: "left" | "right";
  leftPanel: PanelInfo;
  rightPanel: PanelInfo;
  transfers: TransferStarter;
}

interface PendingTransfer {
  files: string[];
  items: Array<{ name: string; isDirectory?: boolean; entryPath?: string }>;
  from: string;
  to: string;
  direction: "upload" | "download" | "local-copy" | "remote-copy" | "archive-extract";
  operation: "copy" | "move";
  archivePath?: string;
  archiveStripPrefix?: string;
}

function normalizedPath(path: string) {
  const normalized = path.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "");
  return normalized || "/";
}

function isSameOrInside(parent: string, candidate: string) {
  const normalizedParent = normalizedPath(parent);
  const normalizedCandidate = normalizedPath(candidate);
  return normalizedCandidate === normalizedParent || normalizedCandidate.startsWith(`${normalizedParent}/`);
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
  connection,
  activeHost,
  activePanel,
  leftPanel,
  rightPanel,
  transfers,
}: UseTransferOrchestrationParams) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  const source = activePanel === "left" ? leftPanel : rightPanel;
  const target = activePanel === "left" ? rightPanel : leftPanel;

  const queueTransfer = useCallback((
    items: PendingTransfer["items"],
    from: string,
    to: string,
    direction: PendingTransfer["direction"],
    operation: PendingTransfer["operation"] = "copy",
    archivePath?: string,
    archiveStripPrefix?: string,
  ) => {
    if (items.length === 0) return;
    setPendingTransfer({
      files: items.map((item) => item.name),
      items,
      from,
      to,
      direction,
      operation,
      archivePath,
      archiveStripPrefix,
    });
    setDialogOpen(true);
  }, []);

  // F5 Copy: from active panel to inactive panel
  const copy = useCallback(() => {
    const selectedFiles = Array.from(source.selection.selected).filter((n) => n !== "..");
    if (selectedFiles.length === 0) return;
    const items = selectedFiles
      .map((name) => source.files.find((file) => file.name === name))
      .filter((file): file is FileItem => !!file)
      .map((file) => ({
        name: file.name,
        isDirectory: file.isDirectory,
        entryPath: file.entryPath,
      }));
    if (items.length === 0) return;

    let direction: PendingTransfer["direction"];
    let archivePath: string | undefined;
    let archiveStripPrefix: string | undefined;
    if (source.mode === "local" && source.isArchiveView) {
      if (target.mode !== "local" || target.isArchiveView) {
        toast.error("Archive contents can only be copied to a local folder.");
        return;
      }
      direction = "archive-extract";
      archivePath = source.archivePath ?? undefined;
      archiveStripPrefix = source.archiveInnerPath ?? "";
      if (!archivePath || items.some((item) => !item.entryPath)) {
        toast.error("Selected archive entries cannot be copied.");
        return;
      }
    } else if (source.mode === "local" && target.mode === "local") {
      if (target.isArchiveView) {
        toast.error("The archive panel is read-only.");
        return;
      }
      if (normalizedPath(source.path) === normalizedPath(target.path)) {
        toast.error("Source and target panels show the same folder.");
        return;
      }
      if (items.some((item) => item.isDirectory && isSameOrInside(joinPath(source.path, item.name), target.path))) {
        toast.error("A folder cannot be copied into itself.");
        return;
      }
      direction = "local-copy";
    } else if (source.mode === "local" && target.mode === "remote") {
      if (!activeHost) {
        toast.error("No remote connection is active.");
        return;
      }
      direction = "upload";
    } else if (source.mode === "remote" && target.mode === "remote") {
      if (!activeHost) {
        toast.error("No remote connection is active.");
        return;
      }
      if (normalizedPath(source.path) === normalizedPath(target.path)) {
        toast.error("Source and target panels show the same folder.");
        return;
      }
      if (items.some((item) => item.isDirectory && isSameOrInside(joinPath(source.path, item.name), target.path))) {
        toast.error("A folder cannot be copied into itself.");
        return;
      }
      direction = "remote-copy";
    } else {
      if (!activeHost) {
        toast.error("No remote connection is active.");
        return;
      }
      direction = "download";
    }

    queueTransfer(items, source.path, target.path, direction, "copy", archivePath, archiveStripPrefix);
  }, [activeHost, source, target, queueTransfer]);

  // F6 Move: transfer to the inactive panel and delete the source only after success.
  const move = useCallback(() => {
    const selectedFiles = Array.from(source.selection.selected).filter((n) => n !== "..");
    if (selectedFiles.length === 0) return;
    const items = selectedFiles
      .map((name) => source.files.find((file) => file.name === name))
      .filter((file): file is FileItem => !!file)
      .map((file) => ({ name: file.name, isDirectory: file.isDirectory, entryPath: file.entryPath }));
    if (items.length === 0) return;

    if (source.isArchiveView || target.isArchiveView) {
      toast.error("Archive view is read-only for move operations.");
      return;
    }
    if (source.mode === "remote" && target.mode === "remote" && !activeHost) {
      toast.error("No remote connection is active.");
      return;
    }
    if (source.mode === "local" && target.mode === "local") {
      if (normalizedPath(source.path) === normalizedPath(target.path)) {
        toast.error("Source and target panels show the same folder.");
        return;
      }
      if (items.some((item) => item.isDirectory && isSameOrInside(joinPath(source.path, item.name), target.path))) {
        toast.error("A folder cannot be moved into itself.");
        return;
      }
    }
    if (source.mode === "remote" && target.mode === "remote") {
      if (normalizedPath(source.path) === normalizedPath(target.path)) {
        toast.error("Source and target panels show the same folder.");
        return;
      }
      if (items.some((item) => item.isDirectory && isSameOrInside(joinPath(source.path, item.name), target.path))) {
        toast.error("A folder cannot be moved into itself.");
        return;
      }
    }

    let direction: PendingTransfer["direction"];
    if (source.mode === "local" && target.mode === "local") direction = "local-copy";
    else if (source.mode === "local" && target.mode === "remote") direction = "upload";
    else if (source.mode === "remote" && target.mode === "remote") direction = "remote-copy";
    else direction = "download";
    queueTransfer(items, source.path, target.path, direction, "move");
  }, [activeHost, queueTransfer, source, target]);

  const dropOnPanel = useCallback((panelSide: "left" | "right", fileNames: string[], operation: "copy" | "move" = "copy") => {
    const dropTarget = panelSide === "left" ? leftPanel : rightPanel;
    const dropSource = panelSide === "left" ? rightPanel : leftPanel;
    const files = fileNames.filter((n) => n !== "..");
    if (files.length === 0) return;
    const items = files
      .map((name) => dropSource.files.find((file) => file.name === name))
      .filter((file): file is FileItem => !!file)
      .map((file) => ({
        name: file.name,
        isDirectory: file.isDirectory,
        entryPath: file.entryPath,
      }));
    if (items.length === 0) return;

    let direction: PendingTransfer["direction"];
    let archivePath: string | undefined;
    let archiveStripPrefix: string | undefined;
    if (dropSource.mode === "local" && dropSource.isArchiveView) {
      if (dropTarget.mode !== "local" || dropTarget.isArchiveView) return;
      direction = "archive-extract";
      archivePath = dropSource.archivePath ?? undefined;
      archiveStripPrefix = dropSource.archiveInnerPath ?? "";
      if (!archivePath || items.some((item) => !item.entryPath)) return;
    } else if (dropSource.mode === "local" && dropTarget.mode === "local") {
      if (dropTarget.isArchiveView) {
        toast.error("The archive panel is read-only.");
        return;
      }
      if (normalizedPath(dropSource.path) === normalizedPath(dropTarget.path)) {
        toast.error("Source and target panels show the same folder.");
        return;
      }
      if (items.some((item) => item.isDirectory && isSameOrInside(joinPath(dropSource.path, item.name), dropTarget.path))) {
        toast.error("A folder cannot be copied into itself.");
        return;
      }
      direction = "local-copy";
    } else if (dropSource.mode === "local" && dropTarget.mode === "remote") {
      if (!activeHost) {
        toast.error("No remote connection is active.");
        return;
      }
      direction = "upload";
    } else if (dropSource.mode === "remote" && dropTarget.mode === "remote") {
      if (!activeHost) {
        toast.error("No remote connection is active.");
        return;
      }
      if (normalizedPath(dropSource.path) === normalizedPath(dropTarget.path)) {
        toast.error("Source and target panels show the same folder.");
        return;
      }
      if (items.some((item) => item.isDirectory && isSameOrInside(joinPath(dropSource.path, item.name), dropTarget.path))) {
        toast.error("A folder cannot be copied into itself.");
        return;
      }
      direction = "remote-copy";
    } else {
      if (!activeHost) {
        toast.error("No remote connection is active.");
        return;
      }
      direction = "download";
    }

    if (operation === "move" && dropSource.isArchiveView) {
      toast.error("Archive view is read-only for move operations.");
      return;
    }
    queueTransfer(items, dropSource.path, dropTarget.path, direction, operation, archivePath, archiveStripPrefix);
  }, [activeHost, leftPanel, rightPanel, queueTransfer]);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setPendingTransfer(null);
    setIsTransferring(false);
  }, []);

  const confirm = useCallback(async (options: TransferOptions) => {
    if (!pendingTransfer) return;
    const payload = toTransferPayload(options);
    const preserveSourcesAfterMove =
      pendingTransfer.operation === "move" &&
      (payload.overwrite === "skip" || payload.overwrite === "overwrite-older");

    if (pendingTransfer.direction === "local-copy") {
      // Local-to-local filesystem copy
      const errors: string[] = [];
      for (const item of pendingTransfer.items) {
        const name = item.name;
        const srcPath = joinPath(pendingTransfer.from, name);
        const dstPath = joinPath(pendingTransfer.to, name);
        try {
          if (item?.isDirectory) {
            await fsCopyDir(srcPath, dstPath, payload);
          } else {
            await fsCopy(srcPath, dstPath, payload);
          }
        } catch (e) {
          console.error(`Local copy ${name} failed:`, e);
          errors.push(`${name}: ${String(e)}`);
        }
      }
      if (errors.length > 0) {
        toast.error("File operation failed", { description: errors.join("\n") });
        return;
      }
      if (pendingTransfer.operation === "move" && !preserveSourcesAfterMove) {
        try {
          for (const item of pendingTransfer.items) {
            await fsRemove(joinPath(pendingTransfer.from, item.name));
          }
        } catch (error) {
          toast.error("Move cleanup failed", { description: String(error) });
          source.refresh();
          target.refresh();
          return;
        }
      } else if (preserveSourcesAfterMove) {
        toast.info("Source files were kept because the collision policy can skip existing targets.");
      }
      source.selection.clear();
      source.refresh();
      target.refresh();
      closeDialog();
      return;
    }

    if (pendingTransfer.direction === "archive-extract") {
      if (!pendingTransfer.archivePath) return;
      const entryPaths = pendingTransfer.items
        .map((item) => item.entryPath)
        .filter((path): path is string => !!path);

      if (entryPaths.length === 0) {
        closeDialog();
        return;
      }

      await archiveExtract(
        pendingTransfer.archivePath,
        pendingTransfer.to,
        entryPaths,
        pendingTransfer.archiveStripPrefix ?? ""
      );
      source.selection.clear();
      target.refresh();
      closeDialog();
      return;
    }

    if (!activeHost) {
      toast.error("No remote connection is active.");
      return;
    }

    // Switch dialog to progress mode (don't close)
    transfers.resetForTransfer();
    setIsTransferring(true);

    const runTransfer = async () => {
      const remoteFiles = pendingTransfer.items.map((item) => ({
        name: item.name,
        remotePath: joinPath(pendingTransfer.from, item.name),
        isDirectory: item.isDirectory ?? false,
      }));

      if (pendingTransfer.direction === "upload") {
        return transfers.startUpload(
          pendingTransfer.items.map((item) => ({
            name: item.name,
            localPath: joinPath(pendingTransfer.from, item.name),
            isDirectory: item.isDirectory ?? false,
          })),
          pendingTransfer.to,
          activeHost.id,
          activeHost.protocol,
          payload,
        );
      }

      if (pendingTransfer.direction === "download") {
        return transfers.startDownload(
          remoteFiles,
          pendingTransfer.to,
          activeHost.id,
          activeHost.protocol,
          payload,
        );
      }

      const tempRoot = joinPath(await fsGetTempDir(), `loftp-${crypto.randomUUID()}`);
      await fsMkdir(tempRoot);
      try {
        const downloaded = await transfers.startDownload(
          remoteFiles,
          tempRoot,
          activeHost.id,
          activeHost.protocol,
          payload,
        );
        if (!downloaded) return false;
        return transfers.startUpload(
          pendingTransfer.items.map((item) => ({
            name: item.name,
            localPath: joinPath(tempRoot, item.name),
            isDirectory: item.isDirectory ?? false,
          })),
          pendingTransfer.to,
          activeHost.id,
          activeHost.protocol,
          payload,
        );
      } finally {
        await fsRemove(tempRoot).catch((error) => {
          console.warn("Temporary transfer cleanup failed:", error);
        });
      }
    };

    const transferPromise = runTransfer();

    transferPromise.then(async (success) => {
      if (!success) return;
      if (pendingTransfer.operation === "move" && !preserveSourcesAfterMove) {
        if (source.mode === "local") {
          for (const item of pendingTransfer.items) {
            await fsRemove(joinPath(pendingTransfer.from, item.name));
          }
        } else {
          for (const item of pendingTransfer.items) {
            if (connection.getStatus(activeHost.id) !== "connected") {
              throw new Error("Remote connection was lost before move cleanup.");
            }
            await connection.deleteRemote(
              activeHost.id,
              joinPath(pendingTransfer.from, item.name),
              item.isDirectory ?? false,
              activeHost.protocol,
            );
          }
        }
      } else if (preserveSourcesAfterMove) {
        toast.info("Source files were kept because the collision policy can skip existing targets.");
      }
      source.selection.clear();
      source.refresh();
      target.refresh();
    }).catch((error) => {
      setIsTransferring(false);
      toast.error("File operation failed", { description: String(error) });
    });
    // Dialog stays open — auto-closes via TransferDialog useEffect when done
  }, [
    activeHost,
    connection,
    closeDialog,
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
    move,
    dropOnPanel,
    closeDialog,
    confirm,
  };
}
