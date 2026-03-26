import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PurchaseDialog } from "./PurchaseDialog";
import { Key, ShoppingCart } from "lucide-react";
import { useI18n } from "@/i18n";

interface SharewareDialogProps {
  open: boolean;
  onContinue: () => void;
  onActivate: () => void;
}

export function SharewareDialog({ open, onContinue, onActivate }: SharewareDialogProps) {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const { t } = useI18n();

  return (
    <>
      <Dialog open={open && !purchaseOpen} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-[400px] bg-card rounded-xl p-0 gap-0 border-border/50 overflow-hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {/* Hero */}
          <div className="flex flex-col items-center pt-10 pb-5 px-8 bg-gradient-to-b from-primary/[0.06] to-transparent">
            <img
              src="/app-icon.png"
              alt="LoFTP"
              className="h-[72px] w-[72px] rounded-[18px] shadow-lg shadow-black/20 dark:shadow-black/30 ring-1 ring-black/[0.08] dark:ring-white/[0.06]"
            />
            <h2 className="text-[20px] font-semibold text-foreground tracking-[-0.3px] mt-4">LoFTP</h2>
            <p className="text-[12px] text-muted-foreground mt-1 tabular-nums">{t("shareware.version")}</p>
          </div>

          <div className="px-8 py-4">
            <p className="text-[12px] text-muted-foreground/70 leading-relaxed text-center">
              {t("shareware.body")}
            </p>
          </div>

          <div className="flex flex-col gap-2 px-8 pb-8">
            <button
              onClick={onContinue}
              className="w-full py-[8px] rounded-lg text-[12px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
            >
              {t("common.continue")}
            </button>
            <button
              onClick={onActivate}
              className="w-full flex items-center justify-center gap-2 py-[8px] rounded-lg text-[12px] font-medium border border-border/50 bg-background/80 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <Key className="h-3.5 w-3.5" />
              {t("shareware.activateLicense")}
            </button>
            <button
              onClick={() => setPurchaseOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-[8px] rounded-lg text-[12px] font-medium border border-border/50 bg-background/80 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {t("shareware.buyLicense")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <PurchaseDialog open={purchaseOpen} onClose={() => setPurchaseOpen(false)} />
    </>
  );
}
