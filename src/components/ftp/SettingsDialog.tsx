import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sun, Moon, Settings } from "lucide-react";
import { useLicense } from "@/hooks/useLicense";
import { useI18n } from "@/i18n";
import { messages as localeMessages } from "@/i18n/messages";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}

export function SettingsDialog({ open, onClose, theme, onThemeChange }: SettingsDialogProps) {
  const [activationCode, setActivationCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [transferAvailable, setTransferAvailable] = useState(false);
  const { isActivated, licenseKey, activate } = useLicense();
  const { locale, setLocale, languages, messages, t } = useI18n();

  const handleActivate = async (forceTransfer = false) => {
    if (!activationCode.trim()) return;
    setActivating(true);
    setActivationError(null);
    try {
      const result = await activate(activationCode.trim(), forceTransfer);
      if (result.status === "activated") {
        setActivationCode("");
        setTransferAvailable(false);
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] bg-card rounded-xl p-0 gap-0 border-border/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">
          <div className="w-9 h-9 rounded-[10px] bg-primary/10 flex items-center justify-center shrink-0">
            <Settings className="h-[18px] w-[18px] text-primary" />
          </div>
          <h3 className="text-[16px] font-semibold text-foreground tracking-[-0.2px]">{t("settings.title")}</h3>
        </div>

        <div className="px-6 pb-5 space-y-5">
          {/* Activation */}
          <section>
            <GroupLabel>{t("settings.license")}</GroupLabel>
            {isActivated ? (
              <div className="rounded-[10px] bg-green-500/[0.06] border border-green-600/15 dark:border-green-500/[0.12] px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)]" />
                  <span className="text-[12px] font-medium text-green-600 dark:text-green-400">{t("settings.fullVersionActivated")}</span>
                </div>
                {licenseKey && (
                  <p className="text-[10px] text-muted-foreground/50 mt-2 pl-4 font-mono">{licenseKey.slice(0, 24)}…</p>
                )}
              </div>
            ) : (
              <div className="rounded-[10px] bg-secondary/40 dark:bg-secondary/20 border border-border/40 px-4 py-3.5">
                <div className="flex gap-2">
                  <input
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    placeholder="XXXX-LIFE-XXXX-XXXX"
                    className="flex-1 px-3 py-[7px] text-[12px] bg-background/80 border border-border/60 rounded-lg text-foreground font-mono outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)] transition-all placeholder:text-muted-foreground/40"
                    onKeyDown={(e) => e.key === "Enter" && handleActivate()}
                  />
                  <button
                    onClick={handleActivate}
                    disabled={!activationCode.trim() || activating}
                    className="px-4 py-[7px] rounded-lg text-[12px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all disabled:opacity-35"
                  >
                    {activating ? "…" : t("settings.activate")}
                  </button>
                </div>
                {activationError && (
                  <p className="text-[11px] text-destructive mt-2 pl-1">{activationError}</p>
                )}
                {transferAvailable && (
                  <button
                    onClick={() => handleActivate(true)}
                    disabled={!activationCode.trim() || activating}
                    className="mt-2 w-full px-4 py-[7px] rounded-lg text-[12px] font-medium border border-border/50 bg-background/80 text-foreground hover:bg-secondary transition-all disabled:opacity-35"
                  >
                    Převést licenci na tento počítač
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Theme */}
          <section>
            <GroupLabel>{t("settings.appearance")}</GroupLabel>
            <div className="flex bg-secondary/40 dark:bg-secondary/20 border border-border/40 rounded-[10px] p-[3px] gap-[3px]">
              <ThemeOption active={theme === "light"} onClick={() => onThemeChange("light")}>
                <Sun className="h-3.5 w-3.5" />
                {t("common.light")}
              </ThemeOption>
              <ThemeOption active={theme === "dark"} onClick={() => onThemeChange("dark")}>
                <Moon className="h-3.5 w-3.5" />
                {t("common.dark")}
              </ThemeOption>
            </div>
          </section>

          {/* Language */}
          <section>
            <GroupLabel>{t("settings.language")}</GroupLabel>
            <div className="grid grid-cols-6 gap-[3px] bg-secondary/40 dark:bg-secondary/20 border border-border/40 rounded-[10px] p-[3px]">
              {languages.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setLocale(lang.value)}
                  title={localeMessages[lang.value].meta.nativeName}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-center transition-all ${
                    locale === lang.value
                      ? "bg-background shadow-sm ring-1 ring-border/60"
                      : "hover:bg-background/50"
                  }`}
                >
                  <span className="text-[17px] leading-none">{lang.label}</span>
                  <span className={`text-[9px] font-medium uppercase tracking-wide ${
                    locale === lang.value ? "text-muted-foreground" : "text-muted-foreground/40"
                  }`}>
                    {lang.code}
                  </span>
                </button>
              ))}
            </div>
          </section>
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
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.8px] mb-2.5 pl-0.5">
      {children}
    </p>
  );
}

function ThemeOption({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-medium transition-all ${
        active
          ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
          : "text-muted-foreground/50 hover:text-foreground hover:bg-background/50"
      }`}
    >
      {children}
    </button>
  );
}
