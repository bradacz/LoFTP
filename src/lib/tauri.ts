import { invoke } from "@tauri-apps/api/core";
import type { HostingConfig, FileItem } from "@/types/ftp";
import type { LicenseStatus, PurchaseCheckout } from "@/types/license";
import type { AvailableUpdate, UpdaterStatus } from "@/types/updater";

// --- Transfer Options (mirrors Rust TransferOptions) ---

export interface TransferOptionsPayload {
  mode: string;
  overwrite: string;
  resume: boolean;
  preserveTimestamps: boolean;
  preservePermissions: boolean;
  followSymlinks: boolean;
  createDirs: boolean;
  verifyAfterTransfer: boolean;
}

// --- Filesystem ---

export async function fsList(path: string): Promise<FileItem[]> {
  return invoke("fs_list", { path });
}

export async function fsGetHome(): Promise<string> {
  return invoke("fs_get_home");
}

export async function fsMkdir(path: string): Promise<void> {
  return invoke("fs_mkdir", { path });
}

export async function fsDelete(path: string): Promise<void> {
  return invoke("fs_delete", { path });
}

export async function fsRename(from: string, to: string): Promise<void> {
  return invoke("fs_rename", { from, to });
}

export async function fsCopy(from: string, to: string): Promise<void> {
  return invoke("fs_copy", { from, to });
}

export async function fsCopyDir(from: string, to: string): Promise<void> {
  return invoke("fs_copy_dir", { from, to });
}

export interface VolumeInfo {
  name: string;
  path: string;
  kind: string;
  isRemovable: boolean;
  totalBytes: number;
  freeBytes: number;
}

export async function fsListVolumes(): Promise<VolumeInfo[]> {
  return invoke("fs_list_volumes");
}

export interface CloudStorageInfo {
  name: string;
  path: string;
  provider: string;
}

export async function fsListCloudStorages(): Promise<CloudStorageInfo[]> {
  return invoke("fs_list_cloud_storages");
}

// --- FTP ---

export async function ftpConnect(hostingId: string, host: string, port: number, username: string, password: string, useTls?: boolean): Promise<void> {
  return invoke("ftp_connect", { hostingId, host, port, username, password, useTls: useTls ?? null });
}

export async function ftpTestConnection(host: string, port: number, username: string, password: string, useTls?: boolean): Promise<void> {
  return invoke("ftp_test_connection", { host, port, username, password, useTls: useTls ?? null });
}

export async function ftpList(hostingId: string, path: string): Promise<FileItem[]> {
  return invoke("ftp_list", { hostingId, path });
}

export async function ftpUpload(hostingId: string, localPath: string, remotePath: string, transferId: string, options?: TransferOptionsPayload): Promise<void> {
  return invoke("ftp_upload", { hostingId, localPath, remotePath, transferId, options: options ?? null });
}

export async function ftpDownload(hostingId: string, remotePath: string, localPath: string, transferId: string, options?: TransferOptionsPayload): Promise<void> {
  return invoke("ftp_download", { hostingId, remotePath, localPath, transferId, options: options ?? null });
}

export async function ftpUploadDir(hostingId: string, localDir: string, remoteDir: string, transferId: string, options?: TransferOptionsPayload): Promise<void> {
  return invoke("ftp_upload_dir", { hostingId, localDir, remoteDir, transferId, options: options ?? null });
}

export async function ftpDownloadDir(hostingId: string, remoteDir: string, localDir: string, transferId: string, options?: TransferOptionsPayload): Promise<void> {
  return invoke("ftp_download_dir", { hostingId, remoteDir, localDir, transferId, options: options ?? null });
}

export async function ftpMkdir(hostingId: string, path: string): Promise<void> {
  return invoke("ftp_mkdir", { hostingId, path });
}

export async function ftpDelete(hostingId: string, path: string, isDir: boolean): Promise<void> {
  return invoke("ftp_delete", { hostingId, path, isDir });
}

export async function ftpRename(hostingId: string, from: string, to: string): Promise<void> {
  return invoke("ftp_rename", { hostingId, from, to });
}

export async function ftpDisconnect(hostingId: string): Promise<void> {
  return invoke("ftp_disconnect", { hostingId });
}

export async function cancelTransfer(transferId: string): Promise<boolean> {
  return invoke("cancel_transfer", { transferId });
}

// --- SFTP ---

export async function sftpConnect(hostingId: string, host: string, port: number, username: string, password: string, sshKeyPath?: string): Promise<void> {
  return invoke("sftp_connect", { hostingId, host, port, username, password, sshKeyPath: sshKeyPath ?? null });
}

export async function sftpTestConnection(host: string, port: number, username: string, password: string, sshKeyPath?: string): Promise<void> {
  return invoke("sftp_test_connection", { host, port, username, password, sshKeyPath: sshKeyPath ?? null });
}

export async function sftpList(hostingId: string, path: string): Promise<FileItem[]> {
  return invoke("sftp_list", { hostingId, path });
}

export async function sftpUpload(hostingId: string, localPath: string, remotePath: string, transferId: string, options?: TransferOptionsPayload): Promise<void> {
  return invoke("sftp_upload", { hostingId, localPath, remotePath, transferId, options: options ?? null });
}

export async function sftpDownload(hostingId: string, remotePath: string, localPath: string, transferId: string, options?: TransferOptionsPayload): Promise<void> {
  return invoke("sftp_download", { hostingId, remotePath, localPath, transferId, options: options ?? null });
}

export async function sftpUploadDir(hostingId: string, localDir: string, remoteDir: string, transferId: string, options?: TransferOptionsPayload): Promise<void> {
  return invoke("sftp_upload_dir", { hostingId, localDir, remoteDir, transferId, options: options ?? null });
}

export async function sftpDownloadDir(hostingId: string, remoteDir: string, localDir: string, transferId: string, options?: TransferOptionsPayload): Promise<void> {
  return invoke("sftp_download_dir", { hostingId, remoteDir, localDir, transferId, options: options ?? null });
}

export async function sftpMkdir(hostingId: string, path: string): Promise<void> {
  return invoke("sftp_mkdir", { hostingId, path });
}

export async function sftpDelete(hostingId: string, path: string, isDir: boolean): Promise<void> {
  return invoke("sftp_delete", { hostingId, path, isDir });
}

export async function sftpRename(hostingId: string, from: string, to: string): Promise<void> {
  return invoke("sftp_rename", { hostingId, from, to });
}

export async function sftpDisconnect(hostingId: string): Promise<void> {
  return invoke("sftp_disconnect", { hostingId });
}

// --- Hosting ---

export async function hostingList(): Promise<HostingConfig[]> {
  return invoke("hosting_list");
}

export async function hostingSave(config: HostingConfig): Promise<void> {
  return invoke("hosting_save", { config });
}

export async function hostingDelete(id: string): Promise<void> {
  return invoke("hosting_delete", { id });
}

// --- License ---

export async function licenseActivate(key: string, forceTransfer?: boolean): Promise<LicenseStatus> {
  return invoke("license_activate", { key, forceTransfer: forceTransfer ?? null });
}

export async function licenseCheck(): Promise<LicenseStatus> {
  return invoke("license_check");
}

export async function licenseGetStatus(): Promise<LicenseStatus> {
  return invoke("license_get_status");
}

// --- Purchase ---

export async function purchaseCreateCheckout(email: string): Promise<PurchaseCheckout> {
  return invoke("purchase_create_checkout", { email });
}

// --- Archive ---

export interface ArchiveEntry {
  name: string;
  size: number;
  isDirectory: boolean;
  modified: string;
}

export async function archiveList(path: string): Promise<ArchiveEntry[]> {
  return invoke("archive_list", { path });
}

export async function archiveListDir(path: string, innerPath?: string): Promise<FileItem[]> {
  return invoke("archive_list_dir", { path, innerPath: innerPath ?? null });
}

export async function archiveExtract(archivePath: string, targetDir: string, files?: string[]): Promise<void> {
  return invoke("archive_extract", { archivePath, targetDir, files: files ?? null });
}

export async function archiveCreate(outputPath: string, sourcePaths: string[], baseDir: string): Promise<void> {
  return invoke("archive_create", { outputPath, sourcePaths, baseDir });
}

export async function archiveReadText(archivePath: string, entryPath: string, maxBytes?: number): Promise<FileContent> {
  return invoke("archive_read_text", { archivePath, entryPath, maxBytes: maxBytes ?? null });
}

export async function archiveReadHex(archivePath: string, entryPath: string, offset: number, length: number): Promise<HexLine[]> {
  return invoke("archive_read_hex", { archivePath, entryPath, offset, length });
}

// --- Search ---

export interface SearchOptions {
  namePattern: string;
  contentPattern?: string;
  recursive: boolean;
  caseSensitive: boolean;
  minSize?: number;
  maxSize?: number;
}

export interface SearchResult {
  path: string;
  name: string;
  size: number;
  modified: string;
  isDirectory: boolean;
  matchLine?: string;
}

export async function fsSearch(path: string, options: SearchOptions): Promise<SearchResult[]> {
  return invoke("fs_search", { path, options });
}

// --- Viewer ---

export interface FileContent {
  content: string;
  fileType: string;
  size: number;
  encoding: string;
  totalLines: number;
  previewDataUrl?: string | null;
}

export interface HexLine {
  offset: number;
  hex: string;
  ascii: string;
}

export async function fsReadText(path: string, maxBytes?: number): Promise<FileContent> {
  return invoke("fs_read_text", { path, maxBytes: maxBytes ?? null });
}

export async function fsReadHex(path: string, offset: number, length: number): Promise<HexLine[]> {
  return invoke("fs_read_hex", { path, offset, length });
}

export async function fsWriteText(path: string, content: string): Promise<void> {
  return invoke("fs_write_text", { path, content });
}

// --- Updater ---

export async function updaterGetStatus(): Promise<UpdaterStatus> {
  return invoke("updater_get_status");
}

export async function updaterCheck(): Promise<AvailableUpdate | null> {
  return invoke("updater_check");
}

export async function updaterInstallPending(): Promise<void> {
  return invoke("updater_install_pending");
}
