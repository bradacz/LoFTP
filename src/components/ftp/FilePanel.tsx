import { useState, useRef, useEffect, useCallback } from "react";
import { Folder, File, ChevronUp, HardDrive, Globe, Copy, Check } from "lucide-react";
import { FileItem } from "@/types/ftp";
import { CompareStatus } from "@/hooks/useDirectoryCompare";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

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

function formatSize(bytes: number): string {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [sortBy, setSortBy] = useState<"name" | "size" | "modified">("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const handleSort = (col: "name" | "size" | "modified") => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else {
      setSortBy(col);
      setSortAsc(true);
    }
  };

  // Ensure ".." entry exists when not at root
  const filesWithParent = (() => {
    const hasParent = files.some((f) => f.name === "..");
    if (hasParent || currentPath === "/" || currentPath === "") return files;
    const parentEntry: FileItem = { name: "..", isDirectory: true, size: 0, modified: "" };
    return [parentEntry, ...files];
  })();

  const sorted = [...filesWithParent].sort((a, b) => {
    if (a.name === "..") return -1;
    if (b.name === "..") return 1;
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    const dir = sortAsc ? 1 : -1;
    if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
    if (sortBy === "size") return (a.size - b.size) * dir;
    return (a.modified.localeCompare(b.modified)) * dir;
  });

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

  return (
    <div
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
      <div className="grid grid-cols-[1fr_80px_130px] px-3 py-1.5 bg-panel-header border-b border-border text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        <button onClick={() => handleSort("name")} className="text-left hover:text-foreground transition-colors">
          Název {sortBy === "name" && (sortAsc ? "↑" : "↓")}
        </button>
        <button onClick={() => handleSort("size")} className="text-right hover:text-foreground transition-colors">
          Velikost {sortBy === "size" && (sortAsc ? "↑" : "↓")}
        </button>
        <button onClick={() => handleSort("modified")} className="text-right hover:text-foreground transition-colors">
          Změněno {sortBy === "modified" && (sortAsc ? "↑" : "↓")}
        </button>
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
                "grid grid-cols-[1fr_80px_130px] px-3 py-1 cursor-pointer transition-colors text-xs font-mono-file",
                isSelected
                  ? "bg-file-selected text-file-selected-text"
                  : cmpClass || "hover:bg-file-hover",
                isFocusedRow && !isSelected && "ring-1 ring-inset ring-primary/40",
                isFocusedRow && isSelected && "ring-1 ring-inset ring-primary"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                {file.isDirectory ? (
                  <Folder className="h-3.5 w-3.5 text-folder shrink-0" />
                ) : (
                  <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="truncate">{file.name}</span>
              </div>
              <div className="text-right text-muted-foreground">
                {file.isDirectory ? t("common.dir") : formatSize(file.size)}
              </div>
              <div className="text-right text-muted-foreground">{file.modified}</div>
            </div>
          );
        })}
      </div>

      {/* Status bar */}
      <div className="px-3 py-1.5 bg-status border-t border-border text-[11px] text-muted-foreground flex justify-between">
        <span>
          {files.filter((f) => !f.isDirectory && f.name !== "..").length} souborů, {files.filter((f) => f.isDirectory && f.name !== "..").length} složek
          {" | "}
          {formatSize(files.filter((f) => !f.isDirectory).reduce((s, f) => s + f.size, 0))}
        </span>
        <span>
          {selectedFiles.size > 0 && (
            <span className="text-primary font-medium">
              {selectedFiles.size} vybráno ({formatSize(files.filter((f) => selectedFiles.has(f.name)).reduce((s, f) => s + f.size, 0))})
            </span>
          )}
        </span>
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
