import { Bot, Code2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useI18n } from "@/i18n";

interface AssistantResultDialogProps {
  open: boolean;
  type: "ai" | "codex";
  title: string;
  body: string;
  loading?: boolean;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
  onClose: () => void;
}

export function AssistantResultDialog({
  open,
  type,
  title,
  body,
  loading,
  actionLabel,
  actionDisabled,
  onAction,
  onClose,
}: AssistantResultDialogProps) {
  const { t } = useI18n();
  const Icon = type === "ai" ? Bot : Code2;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[680px] overflow-hidden rounded-2xl border-border bg-card p-0">
        <header className="flex items-center gap-3 border-b border-border bg-panel-header px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">{type === "ai" ? t("settings.ai") : t("codex.title")}</p>
          </div>
        </header>

        <div className="max-h-[460px] overflow-auto p-5">
          {loading ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : (
            <pre className="whitespace-pre-wrap rounded-xl border border-border bg-background p-4 text-sm leading-6 text-foreground">{body}</pre>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-border bg-panel-header px-5 py-3">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              disabled={actionDisabled}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
            >
              {actionLabel}
            </button>
          )}
          <button onClick={onClose} className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-file-hover">
            {t("common.close")}
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
