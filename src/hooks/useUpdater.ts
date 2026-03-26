import { useCallback, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { updaterCheck, updaterGetStatus, updaterInstallPending } from "@/lib/tauri";
import type { AvailableUpdate, UpdaterInstallEvent, UpdaterStatus } from "@/types/updater";

type UpdateState =
  | "idle"
  | "checking"
  | "no-update"
  | "available"
  | "installing"
  | "error";

export function useUpdater() {
  const [status, setStatus] = useState<UpdaterStatus | null>(null);
  const [availableUpdate, setAvailableUpdate] = useState<AvailableUpdate | null>(null);
  const [state, setState] = useState<UpdateState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [contentLength, setContentLength] = useState<number | null>(null);

  useEffect(() => {
    updaterGetStatus()
      .then(setStatus)
      .catch((err) => {
        setError(String(err));
        setState("error");
      });
  }, []);

  useEffect(() => {
    const unlisten = listen<UpdaterInstallEvent>("updater-install-event", (event) => {
      const payload = event.payload;
      switch (payload.event) {
        case "started":
          setDownloadedBytes(0);
          setContentLength(payload.data?.contentLength ?? null);
          setState("installing");
          break;
        case "progress":
          setDownloadedBytes((prev) => prev + payload.data.chunkLength);
          break;
        case "finished":
          setState("installing");
          break;
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const checkForUpdates = useCallback(async () => {
    setError(null);
    setState("checking");
    setDownloadedBytes(0);
    setContentLength(null);

    try {
      const update = await updaterCheck();
      setAvailableUpdate(update);
      setState(update ? "available" : "no-update");
    } catch (err) {
      setAvailableUpdate(null);
      setError(String(err));
      setState("error");
    }
  }, []);

  const installUpdate = useCallback(async () => {
    setError(null);
    setState("installing");
    try {
      await updaterInstallPending();
    } catch (err) {
      setError(String(err));
      setState("error");
    }
  }, []);

  return {
    status,
    availableUpdate,
    state,
    error,
    downloadedBytes,
    contentLength,
    checkForUpdates,
    installUpdate,
  };
}
