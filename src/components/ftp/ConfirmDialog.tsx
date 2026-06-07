import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useI18n } from "@/i18n";
import type { DeleteProgress } from "@/types/ftp";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  confirmDisabled?: boolean;
  progress?: DeleteProgress | null;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteProgressDetails({ progress }: { progress: DeleteProgress }) {
  const { t } = useI18n();
  const percent = progress.totalItems > 0
    ? Math.min(100, Math.round((progress.completedItems / progress.totalItems) * 100))
    : progress.status === "done"
      ? 100
      : 0;
  const isError = progress.status === "error";
  const isDone = progress.status === "done";
  const barPercent = isError ? Math.max(percent, 2) : isDone ? percent : Math.max(percent, 6);

  return (
    <div className={`mt-4 w-full rounded-[6px] border px-3 py-2 text-left ${isError ? "border-destructive/30 bg-destructive/[0.05]" : "border-border bg-secondary/30"}`}>
      <div className="flex items-center gap-2 text-[11px]">
        {isError ? (
          <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
        ) : isDone ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
        ) : (
          <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
        )}
        <span className={`font-semibold ${isError ? "text-destructive" : "text-foreground"}`}>
          {isError
            ? t("deleteStatus.error")
            : isDone
              ? t("deleteStatus.completed", { count: progress.completedItems })
              : t("deleteStatus.deleting")}
        </span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {progress.completedItems}/{progress.totalItems}
        </span>
      </div>
      <div className="mt-2 font-mono text-[10px] leading-relaxed text-foreground break-all" title={progress.currentPath}>
        {progress.currentPath}
      </div>
      {progress.mode === "remote" && (
        <div className="mt-1 text-[10px] text-muted-foreground">{t("deleteStatus.remote")}</div>
      )}
      {isError && progress.error && (
        <div className="mt-2 text-[10px] leading-relaxed text-destructive break-words">{progress.error}</div>
      )}
      <div className="mt-2 h-[3px] rounded-full bg-progress-track overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${isError ? "bg-destructive" : isDone ? "bg-success" : "bg-primary"}`}
          style={{ width: `${barPercent}%` }}
        />
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "OK",
  danger,
  busy,
  confirmDisabled,
  progress,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !busy) onCancel(); }}>
      <DialogContent className={`sm:max-w-[340px] bg-card rounded-xl p-0 gap-0 border-border/50 ${busy ? "[&>button]:hidden" : ""}`}>
        <div className="flex flex-col items-center pt-6 pb-2 px-6">
          <div className="text-3xl mb-3">{danger ? "🗑" : "❓"}</div>
          <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
          <p className="text-[12px] text-muted-foreground mt-2 text-center leading-relaxed">{message}</p>
          {progress && <DeleteProgressDetails progress={progress} />}
        </div>
        <div className="flex justify-center gap-2 px-6 py-5">
          <button
            onClick={onCancel}
            disabled={busy}
            className="min-w-[80px] px-5 py-[5px] rounded-[5px] text-[12px] border border-border bg-gradient-to-b from-secondary to-secondary/80 text-muted-foreground hover:from-secondary/80 hover:to-secondary/60 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
            className={`min-w-[80px] px-5 py-[5px] rounded-[5px] text-[12px] font-medium border transition-all ${
              danger
                ? "border-destructive/80 bg-gradient-to-b from-destructive to-destructive/80 text-destructive-foreground hover:from-destructive/90 hover:to-destructive/70"
                : "border-primary/80 bg-gradient-to-b from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70"
            } disabled:opacity-50 disabled:pointer-events-none`}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
