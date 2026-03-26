import { useState, useEffect } from "react";
import { X, Eye, FileCode, Binary } from "lucide-react";
import { archiveReadHex, archiveReadText, fsReadText, fsReadHex, FileContent, HexLine } from "@/lib/tauri";
import { useI18n } from "@/i18n";

interface QuickViewPanelProps {
  filePath?: string | null;
  archivePath?: string | null;
  archiveEntryPath?: string | null;
  onClose: () => void;
}

type ViewMode = "text" | "hex";

export function QuickViewPanel({ filePath, archivePath, archiveEntryPath, onClose }: QuickViewPanelProps) {
  const { t } = useI18n();
  const [content, setContent] = useState<FileContent | null>(null);
  const [hexData, setHexData] = useState<HexLine[]>([]);
  const [mode, setMode] = useState<ViewMode>("text");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isArchiveSource = !!archivePath && !!archiveEntryPath;

  useEffect(() => {
    if (!filePath && !isArchiveSource) return;
    setLoading(true);
    setError(null);

    if (mode === "text") {
      const loadText = isArchiveSource
        ? archiveReadText(archivePath!, archiveEntryPath!, 8 * 1024 * 1024)
        : fsReadText(filePath!, 8 * 1024 * 1024);

      loadText
        .then((res) => {
          setContent(res);
          // Auto-switch to hex for binary
          if (res.fileType === "binary") {
            setMode("hex");
          }
        })
        .catch((e) => setError(String(e)))
        .finally(() => setLoading(false));
    } else {
      const loadHex = isArchiveSource
        ? archiveReadHex(archivePath!, archiveEntryPath!, 0, 1024)
        : fsReadHex(filePath!, 0, 1024);

      loadHex
        .then(setHexData)
        .catch((e) => setError(String(e)))
        .finally(() => setLoading(false));
    }
  }, [archiveEntryPath, archivePath, filePath, isArchiveSource, mode]);

  if (!filePath && !isArchiveSource) return null;

  const fileName = isArchiveSource
    ? archiveEntryPath!.split("/").pop() || archiveEntryPath!
    : filePath!.split("/").pop() || filePath!;

  return (
    <div className="flex flex-col h-full bg-panel rounded-lg border border-primary/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-panel-header border-b border-border">
        <Eye className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium text-foreground truncate flex-1">{fileName}</span>

        <div className="flex gap-0.5">
          <button
            onClick={() => setMode("text")}
            className={`p-1 rounded text-[10px] ${mode === "text" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
          >
            <FileCode className="h-3 w-3" />
          </button>
          <button
            onClick={() => setMode("hex")}
            className={`p-1 rounded text-[10px] ${mode === "hex" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
          >
            <Binary className="h-3 w-3" />
          </button>
        </div>

        <button onClick={onClose} className="p-0.5 rounded hover:bg-secondary">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2 font-mono-file text-[11px] leading-relaxed">
        {loading && (
          <div className="text-muted-foreground text-center py-8">{t("quickView.loading")}</div>
        )}
        {error && (
          <div className="text-destructive text-center py-8">{error}</div>
        )}

        {!loading && !error && mode === "text" && content && (
          <div>
            {content.fileType === "image" ? (
              content.previewDataUrl ? (
                <div className="flex items-center justify-center min-h-full p-3">
                  <img
                    src={content.previewDataUrl}
                    alt={fileName}
                    className="max-w-full max-h-[60vh] object-contain rounded"
                  />
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {t("quickView.imageTooLarge", { size: formatSize(content.size) })}
                </div>
              )
            ) : content.fileType === "pdf" ? (
              content.previewDataUrl ? (
                <iframe
                  src={content.previewDataUrl}
                  title={fileName}
                  className="w-full h-[60vh] rounded border border-border bg-background"
                />
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {t("quickView.pdfTooLarge", { size: formatSize(content.size) })}
                </div>
              )
            ) : (
              content.content.split("\n").map((line, i) => (
                <div key={i} className="flex hover:bg-file-hover">
                  <span className="w-10 text-right pr-3 text-muted-foreground select-none shrink-0">
                    {i + 1}
                  </span>
                  <span className="whitespace-pre-wrap break-all text-foreground">{line || " "}</span>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && !error && mode === "hex" && (
          <div>
            {hexData.map((line, i) => (
              <div key={i} className="flex gap-3 hover:bg-file-hover">
                <span className="text-muted-foreground w-16 text-right shrink-0">
                  {line.offset.toString(16).padStart(8, "0").toUpperCase()}
                </span>
                <span className="text-foreground flex-1">{line.hex}</span>
                <span className="text-primary shrink-0">{line.ascii}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {content && (
        <div className="px-3 py-1 bg-panel-header border-t border-border text-[10px] text-muted-foreground flex gap-3">
          <span>{content.encoding}</span>
          <span>{t("quickView.lines", { count: content.totalLines })}</span>
          <span>{formatSize(content.size)}</span>
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
