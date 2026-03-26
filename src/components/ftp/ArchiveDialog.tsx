import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Folder, File, Archive, FolderOpen, Loader2 } from "lucide-react";
import { archiveList, archiveExtract, ArchiveEntry } from "@/lib/tauri";
import { useI18n } from "@/i18n";

interface ArchiveDialogProps {
  open: boolean;
  archivePath: string | null;
  extractTarget: string;
  onClose: () => void;
  onExtracted: () => void;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ArchiveDialog({ open, archivePath, extractTarget, onClose, onExtracted }: ArchiveDialogProps) {
  const { t } = useI18n();
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !archivePath) return;
    setLoading(true);
    setError(null);
    setSelected(new Set());
    archiveList(archivePath)
      .then(setEntries)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [open, archivePath]);

  const handleExtract = async () => {
    if (!archivePath) return;
    setExtracting(true);
    try {
      const files = selected.size > 0 ? Array.from(selected) : undefined;
      await archiveExtract(archivePath, extractTarget, files);
      onExtracted();
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setExtracting(false);
    }
  };

  const fileName = archivePath?.split("/").pop() || "";
  const totalSize = entries.reduce((s, e) => s + e.size, 0);
  const dirs = entries.filter((e) => e.isDirectory).length;
  const files = entries.filter((e) => !e.isDirectory).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[70vh] flex flex-col bg-card">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Archive className="h-4 w-4 text-primary" />
            {fileName}
          </DialogTitle>
        </DialogHeader>

        <div className="text-xs text-muted-foreground mb-2">
          {t("archive.filesAndDirs", { files, dirs })} | {t("archive.total", { size: formatSize(totalSize) })}
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {error && <div className="text-destructive text-xs py-4">{error}</div>}

        {!loading && !error && (
          <div className="flex-1 min-h-0 max-h-[400px] overflow-y-auto border rounded border-border">
            {entries.map((entry, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelected((prev) => {
                    const next = new Set(prev);
                    if (next.has(entry.name)) next.delete(entry.name);
                    else next.add(entry.name);
                    return next;
                  });
                }}
                className={`w-full flex items-center gap-2 px-3 py-1 text-xs text-left hover:bg-file-hover transition-colors ${
                  selected.has(entry.name) ? "bg-file-selected text-file-selected-text" : ""
                }`}
              >
                {entry.isDirectory ? (
                  <Folder className="h-3.5 w-3.5 text-folder shrink-0" />
                ) : (
                  <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="flex-1 font-mono-file truncate">{entry.name}</span>
                <span className="text-muted-foreground shrink-0">
                  {entry.isDirectory ? t("common.dir") : formatSize(entry.size)}
                </span>
              </button>
            ))}
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <div className="flex-1 text-xs text-muted-foreground">
            {selected.size > 0 ? t("common.selectedCount", { count: selected.size }) : t("common.all")}
            {" → "}
            <span className="font-mono-file">{extractTarget}</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>{t("common.close")}</Button>
          <Button size="sm" onClick={handleExtract} disabled={extracting} className="gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            {extracting ? t("archive.extracting") : selected.size > 0 ? t("archive.extractSelected") : t("archive.extractAll")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
