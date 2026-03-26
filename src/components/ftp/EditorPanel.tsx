import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save, X, FileCode } from "lucide-react";
import { fsReadText, fsWriteText } from "@/lib/tauri";
import { useI18n } from "@/i18n";

interface EditorPanelProps {
  open: boolean;
  filePath: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditorPanel({ open, filePath, onClose, onSaved }: EditorPanelProps) {
  const { t } = useI18n();
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lineCount, setLineCount] = useState(0);

  useEffect(() => {
    if (!open || !filePath) return;
    setLoading(true);
    setError(null);
    fsReadText(filePath, 2 * 1024 * 1024) // 2MB limit for editor
      .then((res) => {
        if (res.fileType !== "text") {
          setError(t("editor.unsupported"));
          return;
        }
        setContent(res.content);
        setOriginalContent(res.content);
        setLineCount(res.totalLines);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [open, filePath]);

  const isDirty = content !== originalContent;
  const fileName = filePath?.split("/").pop() || "";

  const handleSave = useCallback(async () => {
    if (!filePath) return;
    setSaving(true);
    try {
      await fsWriteText(filePath, content);
      setOriginalContent(content);
      onSaved();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }, [filePath, content, onSaved]);

  const handleClose = () => {
    if (isDirty) {
      if (!confirm(t("editor.unsavedConfirm"))) return;
    }
    onClose();
  };

  // Ctrl+S shortcut inside dialog
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, handleSave]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col bg-card p-0 gap-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
          <FileCode className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium flex-1 truncate">
            {fileName}
            {isDirty && <span className="text-destructive ml-1">*</span>}
          </span>
          <Button
            variant="default"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? t("editor.saving") : t("editor.save")}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Editor area */}
        <div className="flex-1 min-h-0 flex">
          {loading && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              {t("editor.loadingFile")}
            </div>
          )}
          {error && (
            <div className="flex-1 flex items-center justify-center text-destructive">
              {error}
            </div>
          )}
          {!loading && !error && (
            <>
              {/* Line numbers */}
              <div className="w-12 bg-panel-header border-r border-border overflow-hidden pt-2 select-none">
                <div className="font-mono-file text-[11px] leading-[1.5rem] text-muted-foreground text-right pr-2">
                  {content.split("\n").map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
              </div>
              {/* Text area */}
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setLineCount(e.target.value.split("\n").length);
                }}
                className="flex-1 resize-none bg-panel p-2 font-mono-file text-[11px] leading-[1.5rem] text-foreground focus:outline-none"
                spellCheck={false}
                wrap="off"
              />
            </>
          )}
        </div>

        {/* Status bar */}
        <div className="px-4 py-1 border-t border-border bg-panel-header text-[10px] text-muted-foreground flex gap-4">
          <span>{t("editor.lines", { count: lineCount })}</span>
          <span>UTF-8</span>
          {isDirty && <span className="text-destructive">{t("editor.unsaved")}</span>}
          <span className="flex-1" />
          <span>{t("editor.saveShortcut")}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
