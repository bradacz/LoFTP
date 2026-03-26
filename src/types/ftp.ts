export interface HostingConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  protocol: "ftp" | "sftp";
  useTls?: boolean;
  sshKeyPath?: string;
}

export interface FileItem {
  name: string;
  size: number;
  modified: string;
  isDirectory: boolean;
  permissions?: string;
  isSymlink?: boolean;
  symlinkTarget?: string;
  resolvedPath?: string;
  entryPath?: string;
}

export interface TransferItem {
  id: string;
  fileName: string;
  from: string;
  to: string;
  progress: number;
  status: "pending" | "transferring" | "done" | "error" | "paused" | "cancelled";
  size: number;
  bytesTransferred?: number;
  totalBytes?: number;
  currentFileName?: string;
  currentFileBytesTransferred?: number;
  currentFileTotalBytes?: number;
  completedFiles?: number;
  totalFiles?: number;
  speed?: number;
  eta?: number;
  error?: string;
  startedAt?: number;
}
