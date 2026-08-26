import type { FileItem } from "@/types/ftp";

export const SHOW_HIDDEN_FILES_STORAGE_KEY = "loftp-show-hidden-files";

export function isHiddenFileName(name: string): boolean {
  return name.startsWith(".") && name !== "..";
}

export function filterVisibleFiles(files: FileItem[], showHiddenFiles: boolean): FileItem[] {
  if (showHiddenFiles) return files;
  return files.filter((file) => !isHiddenFileName(file.name));
}
