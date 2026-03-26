import { useMemo, useState, useCallback } from "react";
import { FileItem } from "@/types/ftp";

export type CompareStatus = "same" | "newer" | "older" | "local-only" | "remote-only" | "size-differs";

export interface CompareResult {
  statusMap: Map<string, CompareStatus>;
  stats: {
    same: number;
    newer: number;
    older: number;
    localOnly: number;
    remoteOnly: number;
    sizeDiffers: number;
  };
}

export function useDirectoryCompare() {
  const [isComparing, setIsComparing] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);

  const compare = useCallback((localFiles: FileItem[], remoteFiles: FileItem[]) => {
    const remoteMap = new Map<string, FileItem>();
    remoteFiles.forEach((f) => {
      if (f.name !== "..") remoteMap.set(f.name, f);
    });

    const statusMap = new Map<string, CompareStatus>();
    const stats = { same: 0, newer: 0, older: 0, localOnly: 0, remoteOnly: 0, sizeDiffers: 0 };

    // Check local files against remote
    localFiles.forEach((lf) => {
      if (lf.name === "..") return;
      const rf = remoteMap.get(lf.name);
      if (!rf) {
        statusMap.set(lf.name, "local-only");
        stats.localOnly++;
      } else {
        remoteMap.delete(lf.name);
        if (lf.isDirectory && rf.isDirectory) {
          statusMap.set(lf.name, "same");
          stats.same++;
        } else if (lf.size !== rf.size) {
          statusMap.set(lf.name, "size-differs");
          stats.sizeDiffers++;
        } else if (lf.modified > rf.modified) {
          statusMap.set(lf.name, "newer");
          stats.newer++;
        } else if (lf.modified < rf.modified) {
          statusMap.set(lf.name, "older");
          stats.older++;
        } else {
          statusMap.set(lf.name, "same");
          stats.same++;
        }
      }
    });

    // Remaining remote-only files
    remoteMap.forEach((rf, name) => {
      statusMap.set(name, "remote-only");
      stats.remoteOnly++;
    });

    setResult({ statusMap, stats });
    setIsComparing(true);
  }, []);

  const stop = useCallback(() => {
    setIsComparing(false);
    setResult(null);
  }, []);

  return { isComparing, result, compare, stop };
}
