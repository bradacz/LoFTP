import { useCallback, useState } from "react";
import { FileItem, HostingConfig } from "@/types/ftp";

interface RemoteConnectionLike {
  listRemote: (hostingId: string, path: string, protocol: "ftp" | "sftp") => Promise<FileItem[]>;
  getStatus: (hostingId: string) => "disconnected" | "connecting" | "connected" | "error";
}

export function useRemoteFiles(connection: RemoteConnectionLike, onClearSelection: () => void) {
  const [path, setPath] = useState("/");
  const [files, setFiles] = useState<FileItem[]>([]);

  const load = useCallback(
    async (host: HostingConfig, nextPath: string) => {
      try {
        const nextFiles = await connection.listRemote(host.id, nextPath, host.protocol);
        setFiles(nextFiles);
        setPath(nextPath);
        onClearSelection();
        return nextFiles;
      } catch (error) {
        setFiles([]);
        onClearSelection();
        throw error;
      }
    },
    [connection, onClearSelection]
  );

  const navigate = useCallback(
    async (host: HostingConfig | undefined, nextPath: string) => {
      if (!host) return;
      await load(host, nextPath);
    },
    [load]
  );

  const refresh = useCallback(
    async (host: HostingConfig | undefined) => {
      if (!host || connection.getStatus(host.id) !== "connected") return;
      await load(host, path);
    },
    [connection, load, path]
  );

  const loadRoot = useCallback(
    async (host: HostingConfig) => {
      await load(host, "/");
    },
    [load]
  );

  const reset = useCallback(() => {
    setFiles([]);
    setPath("/");
    onClearSelection();
  }, [onClearSelection]);

  return {
    path,
    files,
    setFiles,
    navigate,
    refresh,
    loadRoot,
    reset,
  };
}
