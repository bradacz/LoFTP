import { useEffect, useRef } from "react";
import { FileItem } from "@/types/ftp";
import { Copy, ClipboardCopy, FolderOpen, Shield, Info, PenLine, Trash2, PackageOpen, FileArchive, Code } from "lucide-react";
import { useI18n } from "@/i18n";

interface ContextMenuProps {
  x: number;
  y: number;
  file: FileItem;
  panelType: "local" | "remote";
  onClose: () => void;
  onCopyPath: () => void;
  onCopyName: () => void;
  onOpenInFinder: () => void;
  onOpenInVSCode?: () => void;
  onOpenArchive?: () => void;
  canOpenArchive?: boolean;
  onCreateArchive?: () => void;
  canCreateArchive?: boolean;
  onProperties: () => void;
  onRename: () => void;
  onDelete: () => void;
  onChmod?: () => void;
}

export function ContextMenu({
  x,
  y,
  file,
  panelType,
  onClose,
  onCopyPath,
  onCopyName,
  onOpenInFinder,
  onOpenInVSCode,
  onOpenArchive,
  canOpenArchive,
  onCreateArchive,
  canCreateArchive,
  onProperties,
  onRename,
  onDelete,
  onChmod,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const style: React.CSSProperties = {
    position: "fixed",
    left: x,
    top: y,
    zIndex: 1000,
  };

  const items: { icon: React.ReactNode; label: string; shortcut?: string; action: () => void; danger?: boolean }[] = [
    { icon: <ClipboardCopy className="h-3.5 w-3.5" />, label: t("contextMenu.copyPath"), shortcut: "Ctrl+Shift+C", action: onCopyPath },
    { icon: <Copy className="h-3.5 w-3.5" />, label: t("contextMenu.copyName"), action: onCopyName },
  ];

  if (panelType === "local") {
    items.push({ icon: <FolderOpen className="h-3.5 w-3.5" />, label: t("contextMenu.openInFinder"), shortcut: "Ctrl+O", action: onOpenInFinder });
    if (file.isDirectory && onOpenInVSCode) {
      items.push({ icon: <Code className="h-3.5 w-3.5" />, label: t("contextMenu.openInVsCode"), action: onOpenInVSCode });
    }
  }

  if (panelType === "local" && onOpenArchive && canOpenArchive) {
    items.push({ icon: <PackageOpen className="h-3.5 w-3.5" />, label: t("contextMenu.openArchive"), action: onOpenArchive });
  }

  if (panelType === "local" && onCreateArchive && canCreateArchive) {
    items.push({ icon: <FileArchive className="h-3.5 w-3.5" />, label: t("contextMenu.createArchive"), action: onCreateArchive });
  }

  if (onChmod) {
    items.push({ icon: <Shield className="h-3.5 w-3.5" />, label: t("contextMenu.chmod"), action: onChmod });
  }

  items.push({ icon: <Info className="h-3.5 w-3.5" />, label: t("contextMenu.properties"), action: onProperties });

  // separator + destructive actions
  const editItems = [
    { icon: <PenLine className="h-3.5 w-3.5" />, label: t("contextMenu.rename"), shortcut: "F6", action: onRename },
    { icon: <Trash2 className="h-3.5 w-3.5" />, label: t("contextMenu.delete"), shortcut: "F8", action: onDelete, danger: true },
  ];

  return (
    <div ref={ref} style={style} className="bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[200px] animate-in fade-in-0 zoom-in-95">
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.action(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-file-hover transition-colors text-left"
        >
          {item.icon}
          <span className="flex-1">{item.label}</span>
          {item.shortcut && <span className="text-muted-foreground text-[10px]">{item.shortcut}</span>}
        </button>
      ))}

      <div className="h-px bg-border my-1" />

      {editItems.map((item, i) => (
        <button
          key={`e${i}`}
          onClick={() => { item.action(); onClose(); }}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-file-hover transition-colors text-left ${
            item.danger ? "text-destructive" : ""
          }`}
        >
          {item.icon}
          <span className="flex-1">{item.label}</span>
          {item.shortcut && <span className="text-muted-foreground text-[10px]">{item.shortcut}</span>}
        </button>
      ))}
    </div>
  );
}
