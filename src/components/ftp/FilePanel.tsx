import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { ChevronUp, HardDrive, Globe, Copy, Check } from "lucide-react";
import { FileItem } from "@/types/ftp";
import { CompareStatus } from "@/hooks/useDirectoryCompare";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { FileTypeIcon } from "./FileTypeIcon";

interface FilePanelProps {
  title: string;
  icon: "local" | "remote";
  files: FileItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onNavigateUp?: () => void;
  selectedFiles: Set<string>;
  onSelect: (name: string, multi: boolean) => void;
  onRangeSelect?: (name: string, files: FileItem[]) => void;
  onUpdateLastClicked?: (index: number) => void;
  onDoubleClick: (file: FileItem) => void;
  onContextMenu?: (e: React.MouseEvent, file: FileItem) => void;
  onDrop?: (fileNames: string[]) => void;
  panelId: string;
  isFocused?: boolean;
  compareStatus?: Map<string, CompareStatus>;
}

type SortColumn = "name" | "type" | "size" | "modified";
type ResizableColumn = "type" | "size" | "modified";
type ColumnWidths = Record<ResizableColumn, number>;
type ResizeBoundary = "type" | "size" | "modified";

const SORT_STORAGE_PREFIX = "loftp-file-panel-sort";
const COLUMN_WIDTHS_STORAGE_PREFIX = "loftp-file-panel-column-widths";
const PANEL_HORIZONTAL_PADDING = 24;
const MIN_NAME_COLUMN_WIDTH = 180;
const DEFAULT_COLUMN_WIDTHS: ColumnWidths = {
  type: 92,
  size: 80,
  modified: 130,
};
const MIN_COLUMN_WIDTHS: ColumnWidths = {
  type: 72,
  size: 72,
  modified: 96,
};

function loadStoredSort(panelId: string): { sortBy: SortColumn; sortAsc: boolean } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${SORT_STORAGE_PREFIX}:${panelId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { sortBy?: SortColumn; sortAsc?: boolean };
    if (!parsed.sortBy || typeof parsed.sortAsc !== "boolean") return null;
    return { sortBy: parsed.sortBy, sortAsc: parsed.sortAsc };
  } catch {
    return null;
  }
}

function storeSort(panelId: string, sortBy: SortColumn, sortAsc: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${SORT_STORAGE_PREFIX}:${panelId}`, JSON.stringify({ sortBy, sortAsc }));
  } catch {
    // Persistence is optional; in-memory sorting still works.
  }
}

function loadStoredColumnWidths(panelId: string): ColumnWidths {
  if (typeof window === "undefined") return DEFAULT_COLUMN_WIDTHS;
  try {
    const raw = window.localStorage.getItem(`${COLUMN_WIDTHS_STORAGE_PREFIX}:${panelId}`);
    if (!raw) return DEFAULT_COLUMN_WIDTHS;
    const parsed = JSON.parse(raw) as Partial<ColumnWidths>;
    return {
      type: typeof parsed.type === "number" ? Math.max(MIN_COLUMN_WIDTHS.type, parsed.type) : DEFAULT_COLUMN_WIDTHS.type,
      size: typeof parsed.size === "number" ? Math.max(MIN_COLUMN_WIDTHS.size, parsed.size) : DEFAULT_COLUMN_WIDTHS.size,
      modified:
        typeof parsed.modified === "number"
          ? Math.max(MIN_COLUMN_WIDTHS.modified, parsed.modified)
          : DEFAULT_COLUMN_WIDTHS.modified,
    };
  } catch {
    return DEFAULT_COLUMN_WIDTHS;
  }
}

function storeColumnWidths(panelId: string, widths: ColumnWidths) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${COLUMN_WIDTHS_STORAGE_PREFIX}:${panelId}`, JSON.stringify(widths));
  } catch {
    // Persistence is optional; in-memory resize still works.
  }
}

function clampColumnWidths(widths: ColumnWidths, panelWidth: number): ColumnWidths {
  const availableWidth = Math.max(panelWidth - PANEL_HORIZONTAL_PADDING, 0);
  const maxFixedWidth = Math.max(0, availableWidth - MIN_NAME_COLUMN_WIDTH);

  const type = Math.max(
    MIN_COLUMN_WIDTHS.type,
    Math.min(widths.type, maxFixedWidth - MIN_COLUMN_WIDTHS.size - MIN_COLUMN_WIDTHS.modified)
  );
  const size = Math.max(
    MIN_COLUMN_WIDTHS.size,
    Math.min(widths.size, maxFixedWidth - type - MIN_COLUMN_WIDTHS.modified)
  );
  const modified = Math.max(
    MIN_COLUMN_WIDTHS.modified,
    Math.min(widths.modified, maxFixedWidth - type - size)
  );

  return { type, size, modified };
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeLabel(file: FileItem, folderLabel: string, fileLabel: string): string {
  if (file.name === "..") return "";
  if (file.isDirectory) return folderLabel;

  const lastDot = file.name.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === file.name.length - 1) return fileLabel;
  return file.name.slice(lastDot + 1).toUpperCase();
}

export function FilePanel({
  title,
  icon,
  files,
  currentPath,
  onNavigate,
  onNavigateUp,
  selectedFiles,
  onSelect,
  onRangeSelect,
  onUpdateLastClicked,
  onDoubleClick,
  onContextMenu,
  onDrop,
  panelId,
  isFocused,
  compareStatus,
}: FilePanelProps) {
  const { t } = useI18n();
  const folderLabel = t("filePanel.folder");
  const fileLabel = t("filePanel.file");
  const [sortBy, setSortBy] = useState<SortColumn>(() => loadStoredSort(panelId)?.sortBy ?? "name");
  const [sortAsc, setSortAsc] = useState(() => loadStoredSort(panelId)?.sortAsc ?? true);
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => loadStoredColumnWidths(panelId));
  const [dragOver, setDragOver] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const resizeStateRef = useRef<{
    boundary: ResizeBoundary;
    startX: number;
    startWidths: ColumnWidths;
  } | null>(null);

  const handleSort = (col: SortColumn) => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else {
      setSortBy(col);
      setSortAsc(true);
    }
  };

  useEffect(() => {
    const stored = loadStoredSort(panelId);
    if (stored) {
      setSortBy(stored.sortBy);
      setSortAsc(stored.sortAsc);
    } else {
      setSortBy("name");
      setSortAsc(true);
    }
    setColumnWidths(loadStoredColumnWidths(panelId));
  }, [panelId]);

  useEffect(() => {
    storeSort(panelId, sortBy, sortAsc);
  }, [panelId, sortBy, sortAsc]);

  useEffect(() => {
    storeColumnWidths(panelId, columnWidths);
  }, [panelId, columnWidths]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState) return;

      const panelWidth = panelRef.current?.clientWidth ?? 0;
      const availableWidth = Math.max(panelWidth - PANEL_HORIZONTAL_PADDING, 0);
      const deltaX = event.clientX - resizeState.startX;

      setColumnWidths((current) => {
        let nextWidths = current;

        if (resizeState.boundary === "type") {
          const maxType = Math.max(
            MIN_COLUMN_WIDTHS.type,
            availableWidth -
              resizeState.startWidths.size -
              resizeState.startWidths.modified -
              MIN_NAME_COLUMN_WIDTH
          );
          const nextType = Math.max(
            MIN_COLUMN_WIDTHS.type,
            Math.min(resizeState.startWidths.type - deltaX, maxType)
          );
          nextWidths = {
            ...current,
            type: nextType,
            size: resizeState.startWidths.size,
            modified: resizeState.startWidths.modified,
          };
        } else if (resizeState.boundary === "size") {
          const total = resizeState.startWidths.type + resizeState.startWidths.size;
          const nextSize = Math.max(
            MIN_COLUMN_WIDTHS.size,
            Math.min(resizeState.startWidths.size - deltaX, total - MIN_COLUMN_WIDTHS.type)
          );
          nextWidths = {
            ...current,
            type: total - nextSize,
            size: nextSize,
            modified: resizeState.startWidths.modified,
          };
        } else if (resizeState.boundary === "modified") {
          const total = resizeState.startWidths.size + resizeState.startWidths.modified;
          const nextModified = Math.max(
            MIN_COLUMN_WIDTHS.modified,
            Math.min(resizeState.startWidths.modified - deltaX, total - MIN_COLUMN_WIDTHS.size)
          );
          nextWidths = {
            ...current,
            type: resizeState.startWidths.type,
            size: total - nextModified,
            modified: nextModified,
          };
        }

        nextWidths = clampColumnWidths(nextWidths, panelWidth);
        if (
          current.type === nextWidths.type &&
          current.size === nextWidths.size &&
          current.modified === nextWidths.modified
        ) {
          return current;
        }
        return nextWidths;
      });
    };

    const handlePointerUp = () => {
      resizeStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const startColumnResize = useCallback(
    (boundary: ResizeBoundary, event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      resizeStateRef.current = {
        boundary,
        startX: event.clientX,
        startWidths: columnWidths,
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [columnWidths]
  );

  useEffect(() => {
    const panelElement = panelRef.current;
    if (!panelElement || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setColumnWidths((current) => {
        const next = clampColumnWidths(current, entry.contentRect.width);
        if (
          next.type === current.type &&
          next.size === current.size &&
          next.modified === current.modified
        ) {
          return current;
        }
        return next;
      });
    });

    observer.observe(panelElement);
    return () => observer.disconnect();
  }, []);

  // Ensure ".." entry exists when not at root
  const filesWithParent = useMemo(() => {
    const hasParent = files.some((f) => f.name === "..");
    if (hasParent || currentPath === "/" || currentPath === "") return files;
    const parentEntry: FileItem = { name: "..", isDirectory: true, size: 0, modified: "" };
    return [parentEntry, ...files];
  }, [files, currentPath]);

  const sorted = useMemo(() => [...filesWithParent].sort((a, b) => {
    if (a.name === "..") return -1;
    if (b.name === "..") return 1;
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    const dir = sortAsc ? 1 : -1;
    if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
    if (sortBy === "type") {
      const typeCmp =
        getFileTypeLabel(a, folderLabel, fileLabel).localeCompare(
          getFileTypeLabel(b, folderLabel, fileLabel)
        ) * dir;
      return typeCmp !== 0 ? typeCmp : a.name.localeCompare(b.name) * dir;
    }
    if (sortBy === "size") return (a.size - b.size) * dir;
    return (a.modified.localeCompare(b.modified)) * dir;
  }), [filesWithParent, sortBy, sortAsc, folderLabel, fileLabel]);

  // Reset focused index when files change
  useEffect(() => {
    setFocusedIndex(0);
  }, [currentPath]);

  // Auto-scroll focused row into view
  const scrollToIndex = useCallback((idx: number) => {
    const row = rowRefs.current.get(idx);
    if (row) {
      row.scrollIntoView({ block: "nearest" });
    }
  }, []);

  // Focus the list when panel becomes focused
  useEffect(() => {
    if (isFocused && listRef.current) {
      listRef.current.focus();
    }
  }, [isFocused]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const len = sorted.length;
    if (len === 0) return;

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = Math.min(focusedIndex + 1, len - 1);
        setFocusedIndex(next);
        scrollToIndex(next);
        if (e.shiftKey && onRangeSelect) {
          onRangeSelect(sorted[next].name, sorted);
        } else if (!e.shiftKey) {
          onSelect(sorted[next].name, false);
        }
        onUpdateLastClicked?.(next);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = Math.max(focusedIndex - 1, 0);
        setFocusedIndex(prev);
        scrollToIndex(prev);
        if (e.shiftKey && onRangeSelect) {
          onRangeSelect(sorted[prev].name, sorted);
        } else if (!e.shiftKey) {
          onSelect(sorted[prev].name, false);
        }
        onUpdateLastClicked?.(prev);
        break;
      }
      case "Home": {
        e.preventDefault();
        setFocusedIndex(0);
        scrollToIndex(0);
        onSelect(sorted[0].name, false);
        break;
      }
      case "End": {
        e.preventDefault();
        const last = len - 1;
        setFocusedIndex(last);
        scrollToIndex(last);
        onSelect(sorted[last].name, false);
        break;
      }
      case "PageDown": {
        e.preventDefault();
        const next = Math.min(focusedIndex + 15, len - 1);
        setFocusedIndex(next);
        scrollToIndex(next);
        onSelect(sorted[next].name, false);
        break;
      }
      case "PageUp": {
        e.preventDefault();
        const prev = Math.max(focusedIndex - 15, 0);
        setFocusedIndex(prev);
        scrollToIndex(prev);
        onSelect(sorted[prev].name, false);
        break;
      }
      case "Enter": {
        e.preventDefault();
        const file = sorted[focusedIndex];
        if (file) onDoubleClick(file);
        break;
      }
      case " ": {
        e.preventDefault();
        const file = sorted[focusedIndex];
        if (file && file.name !== "..") {
          onSelect(file.name, true); // toggle with multi=true
          // Move down after space select
          const next = Math.min(focusedIndex + 1, len - 1);
          setFocusedIndex(next);
          scrollToIndex(next);
        }
        break;
      }
      case "Insert": {
        e.preventDefault();
        const file = sorted[focusedIndex];
        if (file && file.name !== "..") {
          onSelect(file.name, true);
          const next = Math.min(focusedIndex + 1, len - 1);
          setFocusedIndex(next);
          scrollToIndex(next);
        }
        break;
      }
      default: {
        // Letter jump — find first file starting with this letter
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const letter = e.key.toLowerCase();
          const startFrom = focusedIndex + 1;
          let found = -1;
          // Search from current position
          for (let i = startFrom; i < len; i++) {
            if (sorted[i].name.toLowerCase().startsWith(letter)) { found = i; break; }
          }
          // Wrap around
          if (found === -1) {
            for (let i = 0; i < startFrom; i++) {
              if (sorted[i].name.toLowerCase().startsWith(letter)) { found = i; break; }
            }
          }
          if (found >= 0) {
            setFocusedIndex(found);
            scrollToIndex(found);
            onSelect(sorted[found].name, false);
          }
        }
        break;
      }
    }
  }, [sorted, focusedIndex, onSelect, onDoubleClick, onRangeSelect, onUpdateLastClicked, scrollToIndex]);

  const IconComp = icon === "local" ? HardDrive : Globe;
  const gridTemplateColumns = useMemo(
    () => `minmax(0,1fr) ${columnWidths.type}px ${columnWidths.size}px ${columnWidths.modified}px`,
    [columnWidths]
  );

  return (
    <div
      ref={panelRef}
      className={cn(
        "flex flex-col h-full bg-panel rounded-lg border overflow-hidden transition-colors",
        dragOver ? "border-primary border-2" : isFocused ? "border-primary/50 border" : "border-border"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        const source = e.dataTransfer.types.includes("application/x-panel-id")
          ? e.dataTransfer.getData("application/x-panel-id")
          : null;
        if (source !== panelId) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const sourcePanel = e.dataTransfer.getData("application/x-panel-id");
        if (sourcePanel !== panelId && onDrop) {
          const fileNames = JSON.parse(e.dataTransfer.getData("application/x-files") || "[]");
          if (fileNames.length > 0) onDrop(fileNames);
        }
      }}
    >
      {/* Panel header with path */}
      <div className="flex items-center gap-2 px-3 py-2 bg-panel-header border-b border-border">
        <IconComp className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <div className="flex-1 flex items-center gap-1 ml-2">
          <button
            onClick={() => {
              if (onNavigateUp) {
                onNavigateUp();
                return;
              }
              const parent = currentPath.split("/").slice(0, -1).join("/") || "/";
              onNavigate(parent);
            }}
            className="p-0.5 rounded hover:bg-secondary transition-colors"
          >
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <PathBar path={currentPath} onNavigate={onNavigate} />
        </div>
      </div>

      {/* Column headers */}
      <div
        className="grid px-3 py-1.5 bg-panel-header border-b border-border text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
        style={{ gridTemplateColumns }}
      >
        <button onClick={() => handleSort("name")} className="text-left hover:text-foreground transition-colors">
          {t("filePanel.name")} {sortBy === "name" && (sortAsc ? "↑" : "↓")}
        </button>
        <ResizableHeaderButton
          align="center"
          label={`${t("filePanel.type")} ${sortBy === "type" ? (sortAsc ? "↑" : "↓") : ""}`.trim()}
          onClick={() => handleSort("type")}
          onResizeStart={(event) => startColumnResize("type", event)}
          resizeTitle={t("filePanel.resizeColumn")}
        />
        <ResizableHeaderButton
          align="center"
          label={`${t("filePanel.size")} ${sortBy === "size" ? (sortAsc ? "↑" : "↓") : ""}`.trim()}
          onClick={() => handleSort("size")}
          onResizeStart={(event) => startColumnResize("size", event)}
          resizeTitle={t("filePanel.resizeColumn")}
        />
        <ResizableHeaderButton
          align="right"
          label={`${t("filePanel.modified")} ${sortBy === "modified" ? (sortAsc ? "↑" : "↓") : ""}`.trim()}
          onClick={() => handleSort("modified")}
          onResizeStart={(event) => startColumnResize("modified", event)}
          resizeTitle={t("filePanel.resizeColumn")}
        />
      </div>

      {/* File list — keyboard navigable */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto outline-none"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {sorted.map((file, index) => {
          const isSelected = selectedFiles.has(file.name);
          const isFocusedRow = isFocused && index === focusedIndex;
          const cmpStatus = compareStatus?.get(file.name);
          const cmpClass = cmpStatus === "newer" ? "bg-green-500/10"
            : cmpStatus === "older" ? "bg-yellow-500/10"
            : cmpStatus === "local-only" || cmpStatus === "remote-only" ? "bg-blue-500/10"
            : cmpStatus === "size-differs" ? "bg-orange-500/10"
            : "";
          return (
            <div
              key={file.name}
              ref={(el) => { if (el) rowRefs.current.set(index, el); else rowRefs.current.delete(index); }}
              draggable
              onDragStart={(e) => {
                const dragFiles = selectedFiles.has(file.name)
                  ? Array.from(selectedFiles)
                  : [file.name];
                e.dataTransfer.setData("application/x-panel-id", panelId);
                e.dataTransfer.setData("application/x-files", JSON.stringify(dragFiles));
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={(e) => {
                setFocusedIndex(index);
                if (e.shiftKey && onRangeSelect) {
                  onRangeSelect(file.name, sorted);
                } else {
                  onSelect(file.name, e.metaKey || e.ctrlKey);
                }
                onUpdateLastClicked?.(index);
              }}
              onDoubleClick={() => onDoubleClick(file)}
              onContextMenu={(e) => {
                e.preventDefault();
                setFocusedIndex(index);
                if (!isSelected) onSelect(file.name, false);
                onContextMenu?.(e, file);
              }}
              className={cn(
                "grid px-3 py-1 cursor-pointer transition-colors text-xs font-mono-file",
                isSelected
                  ? "bg-file-selected text-file-selected-text"
                  : cmpClass || "hover:bg-file-hover",
                isFocusedRow && !isSelected && "ring-1 ring-inset ring-primary/40",
                isFocusedRow && isSelected && "ring-1 ring-inset ring-primary"
              )}
              style={{ gridTemplateColumns }}
            >
              <div className="flex items-center gap-2 truncate min-w-0">
                <FileTypeIcon fileName={file.name} isDirectory={file.isDirectory} />
                <span className="truncate">{file.name}</span>
              </div>
              <div className="truncate text-center text-muted-foreground">
                {getFileTypeLabel(file, t("filePanel.folder"), t("filePanel.file"))}
              </div>
              <div className="min-w-0 truncate text-center text-muted-foreground">
                {file.isDirectory ? t("common.dir") : formatSize(file.size)}
              </div>
              <div className="min-w-0 truncate text-right text-muted-foreground">{file.modified}</div>
            </div>
          );
        })}
      </div>

      {/* Status bar */}
      <StatusBar files={files} selectedFiles={selectedFiles} />
    </div>
  );
}

const StatusBar = memo(function StatusBar({ files, selectedFiles }: { files: FileItem[]; selectedFiles: Set<string> }) {
  const { t } = useI18n();
  const stats = useMemo(() => {
    const fileCount = files.filter((f) => !f.isDirectory && f.name !== "..").length;
    const dirCount = files.filter((f) => f.isDirectory && f.name !== "..").length;
    const totalSize = files.filter((f) => !f.isDirectory).reduce((s, f) => s + f.size, 0);
    return { fileCount, dirCount, totalSize };
  }, [files]);

  const selectionSize = useMemo(() => {
    if (selectedFiles.size === 0) return 0;
    return files.filter((f) => selectedFiles.has(f.name)).reduce((s, f) => s + f.size, 0);
  }, [files, selectedFiles]);

  return (
    <div className="px-3 py-1.5 bg-status border-t border-border text-[11px] text-muted-foreground flex justify-between">
      <span>
        {t("filePanel.filesAndDirs", { files: stats.fileCount, dirs: stats.dirCount })}
        {" | "}
        {formatSize(stats.totalSize)}
      </span>
      <span>
        {selectedFiles.size > 0 && (
          <span className="text-primary font-medium">
            {t("common.selectedCount", { count: selectedFiles.size })} ({formatSize(selectionSize)})
          </span>
        )}
      </span>
    </div>
  );
});

function ResizableHeaderButton({
  label,
  align,
  onClick,
  onResizeStart,
  resizeTitle,
}: {
  label: string;
  align: "left" | "center" | "right";
  onClick: () => void;
  onResizeStart: (event: React.PointerEvent<HTMLDivElement>) => void;
  resizeTitle: string;
}) {
  return (
    <div className="relative min-w-0">
      <button
        onClick={onClick}
        className={cn(
          "w-full hover:text-foreground transition-colors truncate pl-3",
          align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
        )}
      >
        {label}
      </button>
      <div
        role="separator"
        aria-orientation="vertical"
        className="absolute left-0 top-[-6px] bottom-[-6px] w-3 cursor-col-resize touch-none group"
        onPointerDown={onResizeStart}
        title={resizeTitle}
      >
        <div className="absolute inset-y-1 left-1 w-px bg-border group-hover:bg-primary/70" />
      </div>
    </div>
  );
}

function PathBar({ path, onNavigate }: { path: string; onNavigate: (path: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(path);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const startEdit = () => {
    setEditValue(path);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 30);
  };

  const confirmEdit = () => {
    setEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== path) {
      onNavigate(trimmed);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditValue(path);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="flex-1 bg-background border border-primary rounded px-2 py-1 text-xs font-mono-file text-foreground outline-none"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") confirmEdit();
          if (e.key === "Escape") cancelEdit();
        }}
        onBlur={confirmEdit}
      />
    );
  }

  return (
    <div
      className="flex-1 flex items-center gap-1 bg-secondary rounded px-2 py-1 text-xs font-mono-file text-foreground group cursor-text hover:bg-secondary/80 transition-colors"
      onClick={startEdit}
      title="Kliknutím upravit cestu"
    >
      <span className="truncate flex-1">{path}</span>
      {copied ? (
        <Check className="h-3 w-3 text-success shrink-0" />
      ) : (
        <Copy
          className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 transition-opacity cursor-pointer"
          onClick={handleCopy}
        />
      )}
    </div>
  );
}
