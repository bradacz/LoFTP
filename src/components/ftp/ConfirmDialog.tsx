import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useI18n } from "@/i18n";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = "OK", danger, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-[340px] bg-card rounded-xl p-0 gap-0 border-border/50">
        <div className="flex flex-col items-center pt-6 pb-2 px-6">
          <div className="text-3xl mb-3">{danger ? "🗑" : "❓"}</div>
          <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
          <p className="text-[12px] text-muted-foreground mt-2 text-center leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-center gap-2 px-6 py-5">
          <button onClick={onCancel} className="min-w-[80px] px-5 py-[5px] rounded-[5px] text-[12px] border border-border bg-gradient-to-b from-secondary to-secondary/80 text-muted-foreground hover:from-secondary/80 hover:to-secondary/60 transition-all">
            {t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className={`min-w-[80px] px-5 py-[5px] rounded-[5px] text-[12px] font-medium border transition-all ${
              danger
                ? "border-destructive/80 bg-gradient-to-b from-destructive to-destructive/80 text-destructive-foreground hover:from-destructive/90 hover:to-destructive/70"
                : "border-primary/80 bg-gradient-to-b from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
