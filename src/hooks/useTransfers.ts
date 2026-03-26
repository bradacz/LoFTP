import { useState, useEffect, useCallback, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { TransferItem } from "@/types/ftp";
import {
  ftpUpload, ftpDownload, ftpUploadDir, ftpDownloadDir,
  sftpUpload, sftpDownload, sftpUploadDir, sftpDownloadDir,
  TransferOptionsPayload,
} from "@/lib/tauri";

interface TransferProgressPayload {
  transferId: string;
  fileName: string;
  progress: number;
  status: "pending" | "transferring" | "done" | "error" | "cancelled";
  bytesTransferred: number;
  totalBytes: number;
  currentFileName?: string | null;
  currentFileBytesTransferred?: number | null;
  currentFileTotalBytes?: number | null;
  completedFiles?: number | null;
  totalFiles?: number | null;
}

export function useTransfers() {
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const cleanupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-cleanup: remove completed/cancelled transfers 3s after all finish
  useEffect(() => {
    if (transfers.length === 0) return;

    const hasActive = transfers.some((t) => t.status === "pending" || t.status === "transferring");
    const hasErrors = transfers.some((t) => t.status === "error");
    const hasDone = transfers.some((t) => t.status === "done" || t.status === "cancelled");

    if (!hasActive && hasDone) {
      if (cleanupTimer.current) clearTimeout(cleanupTimer.current);
      cleanupTimer.current = setTimeout(() => {
        setTransfers((prev) => prev.filter((t) => t.status === "error"));
      }, hasErrors ? 3000 : 3000);
    } else {
      if (cleanupTimer.current) {
        clearTimeout(cleanupTimer.current);
        cleanupTimer.current = null;
      }
    }

    return () => {
      if (cleanupTimer.current) clearTimeout(cleanupTimer.current);
    };
  }, [transfers]);

  useEffect(() => {
    const unlisten = listen<TransferProgressPayload>("transfer-progress", (event) => {
      const p = event.payload;
      setTransfers((prev) => {
        const existing = prev.find((t) => t.id === p.transferId);
        if (existing) {
          return prev.map((t) =>
            t.id === p.transferId
              ? {
                  ...t,
                  progress: p.progress,
                  status: p.status,
                  fileName: p.fileName || t.fileName,
                  bytesTransferred: p.bytesTransferred,
                  totalBytes: p.totalBytes,
                  currentFileName: p.currentFileName ?? t.currentFileName,
                  currentFileBytesTransferred: p.currentFileBytesTransferred ?? t.currentFileBytesTransferred,
                  currentFileTotalBytes: p.currentFileTotalBytes ?? t.currentFileTotalBytes,
                  completedFiles: p.completedFiles ?? t.completedFiles,
                  totalFiles: p.totalFiles ?? t.totalFiles,
                  size: p.totalBytes || t.size,
                }
              : t
          );
        }
        return [
          {
            id: p.transferId,
            fileName: p.fileName,
            from: "",
            to: "",
            progress: p.progress,
            status: p.status,
            size: p.totalBytes,
            bytesTransferred: p.bytesTransferred,
            totalBytes: p.totalBytes,
            currentFileName: p.currentFileName ?? undefined,
            currentFileBytesTransferred: p.currentFileBytesTransferred ?? undefined,
            currentFileTotalBytes: p.currentFileTotalBytes ?? undefined,
            completedFiles: p.completedFiles ?? undefined,
            totalFiles: p.totalFiles ?? undefined,
          },
          ...prev,
        ];
      });
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const startUpload = useCallback(
    async (
      files: { name: string; localPath: string; isDirectory?: boolean }[],
      remotePath: string,
      hostingId: string,
      protocol: "ftp" | "sftp",
      options?: TransferOptionsPayload,
    ) => {
      for (const file of files) {
        const transferId = crypto.randomUUID();
        const remoteTarget = `${remotePath}/${file.name}`;

        setTransfers((prev) => [
          {
            id: transferId,
            fileName: file.name,
            from: file.localPath,
            to: remoteTarget,
            progress: 0,
            status: "pending",
            size: 0,
            bytesTransferred: 0,
            totalBytes: 0,
            currentFileName: file.name,
            currentFileBytesTransferred: 0,
            currentFileTotalBytes: 0,
            completedFiles: 0,
            totalFiles: file.isDirectory ? undefined : 1,
          },
          ...prev,
        ]);

        try {
          if (file.isDirectory) {
            // Recursive directory upload
            if (protocol === "sftp") {
              await sftpUploadDir(hostingId, file.localPath, remoteTarget, transferId, options);
            } else {
              await ftpUploadDir(hostingId, file.localPath, remoteTarget, transferId, options);
            }
          } else {
            if (protocol === "sftp") {
              await sftpUpload(hostingId, file.localPath, remoteTarget, transferId, options);
            } else {
              await ftpUpload(hostingId, file.localPath, remoteTarget, transferId, options);
            }
          }
        } catch (e) {
          setTransfers((prev) =>
            prev.map((t) => (t.id === transferId ? { ...t, status: "error" as const } : t))
          );
        }
      }
    },
    []
  );

  const startDownload = useCallback(
    async (
      files: { name: string; remotePath: string; isDirectory?: boolean }[],
      localPath: string,
      hostingId: string,
      protocol: "ftp" | "sftp",
      options?: TransferOptionsPayload,
    ) => {
      for (const file of files) {
        const transferId = crypto.randomUUID();
        const localTarget = `${localPath}/${file.name}`;

        setTransfers((prev) => [
          {
            id: transferId,
            fileName: file.name,
            from: file.remotePath,
            to: localTarget,
            progress: 0,
            status: "pending",
            size: 0,
            bytesTransferred: 0,
            totalBytes: 0,
            currentFileName: file.name,
            currentFileBytesTransferred: 0,
            currentFileTotalBytes: 0,
            completedFiles: 0,
            totalFiles: file.isDirectory ? undefined : 1,
          },
          ...prev,
        ]);

        try {
          if (file.isDirectory) {
            // Recursive directory download
            if (protocol === "sftp") {
              await sftpDownloadDir(hostingId, file.remotePath, localTarget, transferId, options);
            } else {
              await ftpDownloadDir(hostingId, file.remotePath, localTarget, transferId, options);
            }
          } else {
            if (protocol === "sftp") {
              await sftpDownload(hostingId, file.remotePath, localTarget, transferId, options);
            } else {
              await ftpDownload(hostingId, file.remotePath, localTarget, transferId, options);
            }
          }
        } catch (e) {
          setTransfers((prev) =>
            prev.map((t) => (t.id === transferId ? { ...t, status: "error" as const } : t))
          );
        }
      }
    },
    []
  );

  return { transfers, startUpload, startDownload };
}
