import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, ExternalLink } from "lucide-react";
import { purchaseCreateCheckout } from "@/lib/tauri";
import { open } from "@tauri-apps/plugin-shell";
import { useI18n } from "@/i18n";
import { useLicense } from "@/hooks/useLicense";

interface PurchaseDialogProps {
  open: boolean;
  onClose: () => void;
}

export function PurchaseDialog({ open: isOpen, onClose }: PurchaseDialogProps) {
  const { t } = useI18n();
  const license = useLicense();
  const [email, setEmail] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [transferAvailable, setTransferAvailable] = useState(false);

  const handlePurchase = async () => {
    if (!email) return;
    setProcessing(true);
    setError(null);
    try {
      const checkout = await purchaseCreateCheckout(email);
      await open(checkout.checkoutUrl);
      setDone(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setDone(false);
    setProcessing(false);
    setActivating(false);
    setEmail("");
    setActivationCode("");
    setError(null);
    setActivationError(null);
    setTransferAvailable(false);
    onClose();
  };

  const handleActivate = async (forceTransfer = false) => {
    if (!activationCode.trim()) return;
    setActivating(true);
    setActivationError(null);
    try {
      const result = await license.activate(activationCode.trim(), forceTransfer);
      if (result.status === "activated") {
        handleClose();
      } else {
        setActivationError(result.error ?? "Aktivace se nepodařila.");
        setTransferAvailable(Boolean(result.canTransfer));
      }
    } catch (e) {
      setActivationError(String(e));
      setTransferAvailable(false);
    } finally {
      setActivating(false);
    }
  };

  if (done) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md bg-card text-center rounded-2xl">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
              <ExternalLink className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-lg font-bold text-foreground">{t("purchase.doneTitle")}</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t("purchase.doneBody", { email })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("purchase.doneHint")}
            </p>
            <div className="w-full max-w-xs space-y-2 text-left">
              <Label className="text-xs text-muted-foreground">{t("settings.activate")}</Label>
              <Input
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                placeholder="XXXX-LIFE-XXXX-XXXX"
                className="h-8 text-sm font-mono"
                onKeyDown={(e) => e.key === "Enter" && handleActivate()}
              />
              {activationError && <p className="text-xs text-destructive">{activationError}</p>}
              <Button
                size="sm"
                className="w-full"
                onClick={handleActivate}
                disabled={!activationCode.trim() || activating}
              >
                {activating ? t("common.loading") : t("shareware.activateLicense")}
              </Button>
              {transferAvailable && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleActivate(true)}
                  disabled={!activationCode.trim() || activating}
                >
                  Převést licenci na tento počítač
                </Button>
              )}
            </div>
            <Button size="sm" onClick={handleClose}>{t("common.close")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card rounded-2xl">
        <DialogHeader className="gap-3">
          <div className="flex items-center justify-center gap-3">
            <img src="/app-icon.png" alt="LoFTP icon" className="h-11 w-11 rounded-xl shrink-0" />
            <p className="text-2xl font-bold text-foreground tracking-tight">LoFTP</p>
          </div>
          <DialogTitle className="text-base flex items-center justify-center gap-2">
            <CreditCard className="h-4 w-4" />
            {t("purchase.title")}
          </DialogTitle>
          <div className="flex items-center justify-center gap-2 pt-2 pb-1">
            <div className="rounded-md border border-border/60 bg-secondary/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
              Stripe
            </div>
            <span className="text-[11px] text-muted-foreground">{t("purchase.securePayment")}</span>
          </div>
        </DialogHeader>

        <div className="rounded-md bg-secondary/50 border border-border px-3 py-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("purchase.lifetimeLicense")}</span>
          <span className="font-bold text-foreground">29,99 €</span>
        </div>

        <div className="grid gap-3 py-1">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">{t("purchase.email")}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vas@email.cz"
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handlePurchase()}
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>🔒</span>
          <span>{t("purchase.redirectNotice")}</span>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleClose}>{t("common.cancel")}</Button>
          <Button
            size="sm"
            onClick={handlePurchase}
            disabled={!email || processing}
          >
            {processing ? t("common.loading") : t("purchase.openPayment")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
