import { useEffect, useState } from "react";
import { SHOW_HIDDEN_FILES_STORAGE_KEY } from "@/lib/fileVisibility";

const DEFAULT_SHOW_HIDDEN_FILES = false;

function getInitialShowHiddenFiles(): boolean {
  try {
    const stored = localStorage.getItem(SHOW_HIDDEN_FILES_STORAGE_KEY);
    if (stored === "true") return true;
    if (stored === "false") return false;
  } catch {
    return DEFAULT_SHOW_HIDDEN_FILES;
  }
  return DEFAULT_SHOW_HIDDEN_FILES;
}

export function useShowHiddenFiles() {
  const [showHiddenFiles, setShowHiddenFiles] = useState(getInitialShowHiddenFiles);

  useEffect(() => {
    localStorage.setItem(SHOW_HIDDEN_FILES_STORAGE_KEY, String(showHiddenFiles));
  }, [showHiddenFiles]);

  return { showHiddenFiles, setShowHiddenFiles };
}
