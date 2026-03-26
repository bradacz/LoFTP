import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useI18n } from "@/i18n";

interface InputDialogProps {
  open: boolean;
  title: string;
  label: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function InputDialog({ open, title, label, defaultValue = "", onConfirm, onCancel }: InputDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [open, defaultValue]);

  const handleSubmit = () => {
    if (value.trim()) onConfirm(value.trim());
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-[340px] bg-card rounded-xl p-0 gap-0 border-border/50">
        <div className="flex flex-col items-center pt-6 pb-2 px-6">
          <div className="text-3xl mb-3">📁</div>
          <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
          <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
        </div>
        <div className="px-6 pb-4">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            className="w-full px-3 py-[7px] text-[13px] bg-background border border-border rounded-[5px] text-foreground font-mono-file outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.2)]"
          />
        </div>
        <div className="flex justify-center gap-2 px-6 pb-5">
          <button onClick={onCancel} className="min-w-[80px] px-5 py-[5px] rounded-[5px] text-[12px] border border-border bg-gradient-to-b from-secondary to-secondary/80 text-muted-foreground hover:from-secondary/80 hover:to-secondary/60 transition-all">
            {t("common.cancel")}
          </button>
          <button onClick={handleSubmit} className="min-w-[80px] px-5 py-[5px] rounded-[5px] text-[12px] font-medium border border-primary/80 bg-gradient-to-b from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 transition-all">
            {t("common.create")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
