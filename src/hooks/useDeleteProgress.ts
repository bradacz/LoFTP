import { useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import type { DeleteProgress } from "@/types/ftp";

interface DeleteProgressPayload {
  deleteId: string;
  path: string;
  itemName: string;
  completedItems?: number;
}

interface BeginDeleteParams {
  id: string;
  mode: DeleteProgress["mode"];
  rootPath: string;
  totalItems: number;
}

interface StepDeleteParams {
  id: string;
  currentPath: string;
  currentName: string;
  completedItems?: number;
}

interface FinishDeleteParams {
  id: string;
  completedItems?: number;
}

interface FailDeleteParams {
  id: string;
  error: string;
}

export interface DeleteProgressController {
  status: DeleteProgress | null;
  begin: (params: BeginDeleteParams) => void;
  step: (params: StepDeleteParams) => void;
  finish: (params: FinishDeleteParams) => void;
  fail: (params: FailDeleteParams) => void;
  clear: () => void;
}

function fileNameFromPath(path: string): string {
  return path.split("/").filter(Boolean).pop() || path || "/";
}

export function useDeleteProgress(): DeleteProgressController {
  const [status, setStatus] = useState<DeleteProgress | null>(null);
  const activeDeleteIdRef = useRef<string | null>(null);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCleanupTimer = useCallback(() => {
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }
  }, []);

  const begin = useCallback((params: BeginDeleteParams) => {
    clearCleanupTimer();
    activeDeleteIdRef.current = params.id;
    setStatus({
      id: params.id,
      mode: params.mode,
      rootPath: params.rootPath,
      currentPath: params.rootPath,
      currentName: fileNameFromPath(params.rootPath),
      completedItems: 0,
      totalItems: params.totalItems,
      status: "pending",
      startedAt: Date.now(),
    });
  }, [clearCleanupTimer]);

  const step = useCallback((params: StepDeleteParams) => {
    setStatus((prev) => {
      if (!prev || prev.id !== params.id) return prev;
      return {
        ...prev,
        currentPath: params.currentPath,
        currentName: params.currentName,
        completedItems: params.completedItems ?? prev.completedItems,
        status: "deleting",
        error: undefined,
      };
    });
  }, []);

  const finish = useCallback((params: FinishDeleteParams) => {
    activeDeleteIdRef.current = null;
    setStatus((prev) => {
      if (!prev || prev.id !== params.id) return prev;
      const completedItems = params.completedItems ?? prev.completedItems;
      return {
        ...prev,
        completedItems,
        status: "done",
        error: undefined,
      };
    });
    clearCleanupTimer();
    cleanupTimerRef.current = setTimeout(() => {
      setStatus((prev) => (prev?.id === params.id ? null : prev));
      cleanupTimerRef.current = null;
    }, 2500);
  }, [clearCleanupTimer]);

  const fail = useCallback((params: FailDeleteParams) => {
    activeDeleteIdRef.current = null;
    clearCleanupTimer();
    setStatus((prev) => {
      if (!prev || prev.id !== params.id) return prev;
      return {
        ...prev,
        status: "error",
        error: params.error,
      };
    });
  }, [clearCleanupTimer]);

  const clear = useCallback(() => {
    activeDeleteIdRef.current = null;
    clearCleanupTimer();
    setStatus(null);
  }, [clearCleanupTimer]);

  useEffect(() => {
    const unlisten = listen<DeleteProgressPayload>("delete-progress", (event) => {
      const payload = event.payload;
      if (payload.deleteId !== activeDeleteIdRef.current) return;
      step({
        id: payload.deleteId,
        currentPath: payload.path,
        currentName: payload.itemName || fileNameFromPath(payload.path),
        completedItems: typeof payload.completedItems === "number" ? payload.completedItems : undefined,
      });
    });

    return () => {
      unlisten.then((fn) => fn());
      clearCleanupTimer();
    };
  }, [clearCleanupTimer, step]);

  return {
    status,
    begin,
    step,
    finish,
    fail,
    clear,
  };
}
