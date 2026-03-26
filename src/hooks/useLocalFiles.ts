import { useState, useEffect, useCallback } from "react";
import { FileItem } from "@/types/ftp";
import { archiveListDir, fsList, fsGetHome } from "@/lib/tauri";
import { toast } from "@/components/ui/sonner";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { useI18n } from "@/i18n";

type LocalLocation =
  | { kind: "fs"; path: string }
  | { kind: "archive"; archivePath: string; innerPath: string; hostPath: string };

const ONEDRIVE_FALLBACK_PATH_KEY = "loftp.onedriveFallbackPath";

function getStoredOneDriveFallbackPath() {
  return window.localStorage.getItem(ONEDRIVE_FALLBACK_PATH_KEY);
}

function setStoredOneDriveFallbackPath(path: string) {
  window.localStorage.setItem(ONEDRIVE_FALLBACK_PATH_KEY, path);
}

function clearStoredOneDriveFallbackPath() {
  window.localStorage.removeItem(ONEDRIVE_FALLBACK_PATH_KEY);
}

export function useLocalFiles() {
  const { t } = useI18n();
  const [location, setLocation] = useState<LocalLocation | null>(null);
  const [path, setPath] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickCloudStorageFolder = useCallback(async () => {
    const home = await fsGetHome();
    const selected = await openDialog({
      directory: true,
      multiple: false,
      defaultPath: `${home}/Library/CloudStorage`,
      title: "Select OneDrive folder",
    });

    return typeof selected === "string" ? selected : null;
  }, []);

  const shouldOfferCloudStoragePicker = (nextLocation: LocalLocation, message: string) => {
    if (nextLocation.kind !== "fs") return false;
    const lowered = message.toLowerCase();
    return (
      lowered.includes("cloudstorage") ||
      lowered.includes("/library/cloudstorage/") ||
      lowered.includes("operation not permitted")
    );
  };

  const loadFiles = useCallback(async (nextLocation: LocalLocation, allowCloudStoragePicker = true) => {
    setLoading(true);
    setError(null);
    try {
      const items = nextLocation.kind === "fs"
        ? await fsList(nextLocation.path)
        : await archiveListDir(nextLocation.archivePath, nextLocation.innerPath);
      setFiles(items);
      setLocation(nextLocation);
      setPath(
        nextLocation.kind === "fs"
          ? nextLocation.path
          : `${nextLocation.archivePath}!/${nextLocation.innerPath}`
              .replace(/!\/$/, "!/")
      );
      setError(null);
    } catch (e) {
      const message = String(e);
      if (allowCloudStoragePicker && shouldOfferCloudStoragePicker(nextLocation, message)) {
        try {
          const storedPath = getStoredOneDriveFallbackPath();
          if (storedPath) {
            try {
              await loadFiles({ kind: "fs", path: storedPath }, false);
              toast.info(t("toasts.onedriveOpenedStored"));
              return;
            } catch {
              clearStoredOneDriveFallbackPath();
            }
          }

          const selectedPath = await pickCloudStorageFolder();
          if (selectedPath) {
            setStoredOneDriveFallbackPath(selectedPath);
            await loadFiles({ kind: "fs", path: selectedPath }, false);
            toast.info(t("toasts.onedriveOpenedPicker"));
            return;
          }
        } catch (pickerError) {
          const pickerMessage = String(pickerError);
          setError(pickerMessage);
          toast.error(t("toasts.onedrivePickFailed"), {
            description: pickerMessage,
          });
          return;
        }
      }

      setError(message);
      toast.error(t("toasts.folderOpenFailed"), {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }, [pickCloudStorageFolder, t]);

  const navigate = useCallback((newPath: string) => {
    loadFiles({ kind: "fs", path: newPath });
  }, [loadFiles]);

  const openArchive = useCallback((archivePath: string, innerPath = "", hostPath?: string) => {
    loadFiles({
      kind: "archive",
      archivePath,
      innerPath,
      hostPath: hostPath ?? (archivePath.split("/").slice(0, -1).join("/") || "/"),
    });
  }, [loadFiles]);

  const navigateUp = useCallback(() => {
    if (!location) return;
    if (location.kind === "fs") {
      navigate(location.path.split("/").slice(0, -1).join("/") || "/");
      return;
    }

    if (!location.innerPath) {
      navigate(location.hostPath);
      return;
    }

    const parentInner = location.innerPath.split("/").slice(0, -1).join("/");
    openArchive(location.archivePath, parentInner, location.hostPath);
  }, [location, navigate, openArchive]);

  const refresh = useCallback(() => {
    if (!location) return;
    loadFiles(location);
  }, [loadFiles, location]);

  // Load home directory on mount
  useEffect(() => {
    fsGetHome().then((home) => loadFiles({ kind: "fs", path: home }));
  }, [loadFiles]);

  return {
    path,
    files,
    loading,
    error,
    navigate,
    openArchive,
    navigateUp,
    refresh,
    isArchiveView: location?.kind === "archive",
    archivePath: location?.kind === "archive" ? location.archivePath : null,
    archiveInnerPath: location?.kind === "archive" ? location.innerPath : null,
  };
}
