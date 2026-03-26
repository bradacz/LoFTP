import { useState, useCallback } from "react";
import { HostingConfig, FileItem } from "@/types/ftp";
import {
  ftpConnect, ftpList, ftpDisconnect, ftpMkdir, ftpDelete, ftpRename,
  sftpConnect, sftpList, sftpDisconnect, sftpMkdir, sftpDelete, sftpRename,
} from "@/lib/tauri";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export function useConnection() {
  const [statuses, setStatuses] = useState<Record<string, ConnectionStatus>>({});
  const [transportStatuses, setTransportStatuses] = useState<Record<string, ConnectionStatus>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setStatus = (id: string, status: ConnectionStatus, error?: string) => {
    setStatuses((prev) => ({ ...prev, [id]: status }));
    if (status === "connected" || status === "disconnected" || status === "error") {
      setTransportStatuses((prev) => ({ ...prev, [id]: status }));
    }
    if (error) setErrors((prev) => ({ ...prev, [id]: error }));
    else setErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const setTransportStatus = (id: string, status: ConnectionStatus) => {
    setTransportStatuses((prev) => ({ ...prev, [id]: status }));
  };

  const disconnectTransport = useCallback(async (hostingId: string, protocol: "ftp" | "sftp") => {
    if (protocol === "sftp") {
      await sftpDisconnect(hostingId);
      return;
    }
    await ftpDisconnect(hostingId);
  }, []);

  const connect = useCallback(async (config: HostingConfig) => {
    setStatus(config.id, "connecting");
    setTransportStatus(config.id, "connecting");
    try {
      if (config.protocol === "sftp") {
        await sftpConnect(config.id, config.host, config.port, config.username, config.password, config.sshKeyPath);
      } else {
        await ftpConnect(config.id, config.host, config.port, config.username, config.password, config.useTls);
      }
      setTransportStatus(config.id, "connected");
    } catch (e) {
      setStatus(config.id, "error", String(e));
      throw e;
    }
  }, []);

  const markConnected = useCallback((hostingId: string) => {
    setStatus(hostingId, "connected");
  }, []);

  const markError = useCallback((hostingId: string, error: string) => {
    setStatus(hostingId, "error", error);
  }, []);

  const disconnect = useCallback(async (hostingId: string, protocol: "ftp" | "sftp") => {
    try {
      await disconnectTransport(hostingId, protocol);
    } finally {
      setStatus(hostingId, "disconnected");
    }
  }, [disconnectTransport]);

  const listRemote = useCallback(async (hostingId: string, path: string, protocol: "ftp" | "sftp"): Promise<FileItem[]> => {
    try {
      if (protocol === "sftp") {
        return await sftpList(hostingId, path);
      }
      return await ftpList(hostingId, path);
    } catch (e) {
      try {
        await disconnectTransport(hostingId, protocol);
      } catch {
        // Best-effort cleanup; the original listing error is more important.
      }
      setStatus(hostingId, "error", String(e));
      throw e;
    }
  }, [disconnectTransport]);

  const mkdirRemote = useCallback(async (hostingId: string, path: string, protocol: "ftp" | "sftp") => {
    if (protocol === "sftp") return sftpMkdir(hostingId, path);
    return ftpMkdir(hostingId, path);
  }, []);

  const deleteRemote = useCallback(async (hostingId: string, path: string, isDir: boolean, protocol: "ftp" | "sftp") => {
    if (protocol === "sftp") return sftpDelete(hostingId, path, isDir);
    return ftpDelete(hostingId, path, isDir);
  }, []);

  const renameRemote = useCallback(async (hostingId: string, from: string, to: string, protocol: "ftp" | "sftp") => {
    if (protocol === "sftp") return sftpRename(hostingId, from, to);
    return ftpRename(hostingId, from, to);
  }, []);

  return {
    statuses,
    errors,
    connect,
    markConnected,
    markError,
    disconnect,
    listRemote,
    mkdirRemote,
    deleteRemote,
    renameRemote,
    getStatus: (id: string) => statuses[id] || "disconnected",
    getTransportStatus: (id: string) => transportStatuses[id] || "disconnected",
  };
}
