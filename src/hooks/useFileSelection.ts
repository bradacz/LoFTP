import { useCallback, useRef, useState } from "react";
import { FileItem } from "@/types/ftp";

function matchGlob(pattern: string, name: string): boolean {
  const regex = new RegExp(
    "^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".") + "$",
    "i"
  );
  return regex.test(name);
}

export function useFileSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const lastClickedRef = useRef<number>(-1);

  const toggle = useCallback((name: string, multi: boolean) => {
    setSelected((prev) => {
      const next = new Set(multi ? prev : []);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const rangeSelect = useCallback((name: string, files: FileItem[]) => {
    const currentIndex = files.findIndex((f) => f.name === name);
    const lastIndex = lastClickedRef.current;
    if (lastIndex < 0 || currentIndex < 0) {
      // Fallback to single select
      setSelected(new Set([name]));
      lastClickedRef.current = currentIndex;
      return;
    }
    const start = Math.min(lastIndex, currentIndex);
    const end = Math.max(lastIndex, currentIndex);
    setSelected((prev) => {
      const next = new Set(prev);
      for (let i = start; i <= end; i++) {
        if (files[i] && files[i].name !== "..") {
          next.add(files[i].name);
        }
      }
      return next;
    });
  }, []);

  const updateLastClicked = useCallback((index: number) => {
    lastClickedRef.current = index;
  }, []);

  const selectAll = useCallback((files: FileItem[]) => {
    setSelected(new Set(files.filter((f) => f.name !== "..").map((f) => f.name)));
  }, []);

  const invertSelection = useCallback((files: FileItem[]) => {
    setSelected((prev) => {
      const all = files.filter((f) => f.name !== "..").map((f) => f.name);
      return new Set(all.filter((n) => !prev.has(n)));
    });
  }, []);

  const selectByPattern = useCallback((pattern: string, files: FileItem[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      files.forEach((f) => {
        if (f.name !== ".." && matchGlob(pattern, f.name)) next.add(f.name);
      });
      return next;
    });
  }, []);

  const deselectByPattern = useCallback((pattern: string, files: FileItem[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      files.forEach((f) => {
        if (matchGlob(pattern, f.name)) next.delete(f.name);
      });
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelected(new Set());
    lastClickedRef.current = -1;
  }, []);

  const getSelectionSize = useCallback((files: FileItem[]) => {
    return files.filter((f) => selected.has(f.name)).reduce((sum, f) => sum + f.size, 0);
  }, [selected]);

  return {
    selected,
    setSelected,
    toggle,
    rangeSelect,
    updateLastClicked,
    selectAll,
    invertSelection,
    selectByPattern,
    deselectByPattern,
    clear,
    getSelectionSize,
  };
}
