import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { open } from "@tauri-apps/plugin-shell";
import { LegalDialog } from "./LegalDialog";
import { useUpdater } from "@/hooks/useUpdater";
import { Check, Download, Loader2 } from "lucide-react";
import { useI18n } from "@/i18n";

const websiteUrl = "https://www.mylocalio.com";
const productWebsiteUrl = "https://www.loftp.space";

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AboutDialog({ open: isOpen, onClose }: AboutDialogProps) {
  const [eulaOpen, setEulaOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const updater = useUpdater();
  const { messages, t } = useI18n();

  const updateStatusText = () => {
    if (!updater.status) return t("common.loading");
    if (!updater.status.configured) return t("about.updatesNotConfigured");
    if (updater.state === "checking") return t("about.checking");
    if (updater.state === "no-update") return t("about.latest");
    if (updater.state === "available" && updater.availableUpdate)
      return t("about.updateAvailable", { version: updater.availableUpdate.version });
    if (updater.state === "installing") {
      const pct = updater.contentLength && updater.contentLength > 0
        ? Math.min(100, Math.round((updater.downloadedBytes / updater.contentLength) * 100))
        : null;
      return pct !== null ? t("about.installing", { percent: pct }) : t("common.loading");
    }
    if (updater.error) return t("about.updateError");
    return t("about.notChecked");
  };

  const statusColor = () => {
    if (updater.state === "no-update") return "text-green-600 dark:text-green-400";
    if (updater.state === "available") return "text-primary";
    if (updater.error) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[420px] bg-card rounded-xl p-0 gap-0 border-border/50 overflow-hidden">
          {/* Hero */}
          <div className="flex flex-col items-center pt-8 pb-5 px-8 bg-gradient-to-b from-primary/[0.06] to-transparent">
            <img
              src="/app-icon.png"
              alt="LoFTP"
              className="h-[72px] w-[72px] rounded-[18px] shadow-lg shadow-black/20 dark:shadow-black/30 ring-1 ring-black/[0.08] dark:ring-white/[0.06]"
            />
            <h2 className="text-[20px] font-semibold text-foreground tracking-[-0.3px] mt-4">LoFTP</h2>
            <p className="text-[12px] text-muted-foreground mt-1 tabular-nums">
              {t("about.version", { version: updater.status?.currentVersion ?? "1.0.0" })}
            </p>
            <p className="text-[12px] text-muted-foreground/60 text-center leading-relaxed mt-3 max-w-[300px]">
              {t("about.description")}
            </p>
          </div>

          <div className="px-6 pb-5 space-y-3">
            {/* Info card */}
            <div className="rounded-[10px] bg-secondary/40 dark:bg-secondary/20 border border-border/40 px-4 py-3.5">
              <p className="text-[10px] text-muted-foreground/60 text-center mb-1.5">{messages.legal.copyrightNotice}</p>
              <div className="flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  className="text-[12px] text-primary hover:underline transition-colors"
                  onClick={() => open(websiteUrl)}
                >
                  www.mylocalio.com
                </button>
                <span className="text-[10px] text-muted-foreground/30">&middot;</span>
                <button
                  type="button"
                  className="text-[12px] text-primary hover:underline transition-colors"
                  onClick={() => open(productWebsiteUrl)}
                >
                  www.loftp.space
                </button>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <button
                  onClick={() => setEulaOpen(true)}
                  className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground hover:underline underline-offset-2 transition-colors"
                >
                  {t("about.eula")}
                </button>
                <button
                  onClick={() => setTermsOpen(true)}
                  className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground hover:underline underline-offset-2 transition-colors"
                >
                  {t("about.terms")}
                </button>
                <button
                  onClick={() => setPrivacyOpen(true)}
                  className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground hover:underline underline-offset-2 transition-colors"
                >
                  {t("about.privacy")}
                </button>
              </div>
            </div>

            {/* Update section */}
            <div className="rounded-[10px] bg-secondary/40 dark:bg-secondary/20 border border-border/40 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
                <span className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.5px]">
                  {t("about.updates")}
                </span>
                <span className={`text-[11px] font-medium ${statusColor()}`}>
                  {updater.state === "no-update" && <Check className="inline h-3 w-3 mr-0.5 -mt-px" />}
                  {updater.state === "checking" && <Loader2 className="inline h-3 w-3 mr-0.5 -mt-px animate-spin" />}
                  {updateStatusText()}
                </span>
              </div>
              <div className="flex gap-2 px-4 py-3">
                <button
                  onClick={updater.checkForUpdates}
                  disabled={updater.state === "checking" || updater.state === "installing"}
                  className="flex-1 py-[7px] rounded-lg text-[11px] font-medium border border-border/50 bg-background/80 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all disabled:opacity-35"
                >
                  {t("about.check")}
                </button>
                <button
                  onClick={updater.installUpdate}
                  disabled={updater.state !== "available" || !updater.availableUpdate}
                  className="flex-1 flex items-center justify-center gap-1.5 py-[7px] rounded-lg text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all disabled:opacity-35"
                >
                  <Download className="h-3 w-3" />
                  {t("common.install")}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-center px-6 py-4 border-t border-border/30">
            <button
              onClick={onClose}
              className="min-w-[100px] px-5 py-[7px] rounded-lg text-[12px] font-medium border border-border/50 bg-background/80 text-foreground hover:bg-secondary transition-all"
            >
              {t("common.close")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <LegalDialog
        open={eulaOpen}
        onClose={() => setEulaOpen(false)}
        title={messages.legal.eulaTitle}
        sections={messages.legal.eulaSections}
      />
      <LegalDialog
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        title={messages.legal.termsTitle}
        sections={messages.legal.termsSections}
      />
      <LegalDialog
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        title={messages.legal.privacyTitle}
        sections={messages.legal.privacySections}
      />
    </>
  );
}
