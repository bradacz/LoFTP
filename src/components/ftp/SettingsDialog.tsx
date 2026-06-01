import { useEffect, useState } from "react";
import type React from "react";
import {
  Bot,
  CheckCircle2,
  Code2,
  Eye,
  KeyRound,
  Laptop,
  Menu,
  Moon,
  PlugZap,
  Settings,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLicense } from "@/hooks/useLicense";
import { useI18n } from "@/i18n";
import { messages as localeMessages } from "@/i18n/messages";
import { cn } from "@/lib/utils";
import { aiGetSettings, aiSaveSettings, aiTestSettings, codexGetBridgeSettings, codexListHostings, codexSaveBridgeSettings } from "@/lib/tauri";
import type { CodexHostingSummary } from "@/lib/tauri";
import { toast } from "@/components/ui/sonner";
import type { ContextMenuAction, ContextMenuSettings } from "@/types/contextMenu";
import { DEFAULT_CONTEXT_MENU_SETTINGS, getContextMenuSettings, resetContextMenuSettings, saveContextMenuSettings } from "@/lib/contextMenuSettings";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}

type SettingsSection = "general" | "appearance" | "context" | "ai" | "codex" | "integrations" | "license";

const AI_PROVIDERS = [
  "OpenAI",
  "Claude",
  "Gemini",
  "Perplexity",
  "OpenAI-compatible API",
  "OpenCode API",
  "NVIDIA",
];

const CONTEXT_MENU_GROUPS: Array<{ titleKey: string; actions: ContextMenuAction[] }> = [
  { titleKey: "settings.contextMenuClipboard", actions: ["copyPath", "copyName", "copyBaseName", "copyFiles", "pasteFiles"] },
  { titleKey: "settings.contextMenuOpen", actions: ["openInFinder", "openInVSCode", "openNatively", "openWith"] },
  { titleKey: "settings.contextMenuArchive", actions: ["openAsArchive", "openArchive", "createArchive", "extractHere", "extractTo"] },
  { titleKey: "settings.contextMenuFileOps", actions: ["copyTo", "moveTo", "newFile", "newFolder", "rename", "delete", "refresh", "search"] },
  { titleKey: "settings.contextMenuSelection", actions: ["selectAll", "deselectAll", "invertSelection", "selectByExtension", "selectByPattern"] },
  { titleKey: "settings.contextMenuProps", actions: ["properties", "chmod", "changeDate", "calculateChecksum"] },
  { titleKey: "settings.contextMenuAdvanced", actions: ["batchRename", "splitFile", "combineFiles", "compareFolders", "aiExplainFile", "codexExplainFile"] },
];

export function SettingsDialog({ open, onClose, theme, onThemeChange }: SettingsDialogProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const [activationCode, setActivationCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [transferAvailable, setTransferAvailable] = useState(false);
  const [aiProvider, setAiProvider] = useState("OpenAI");
  const [aiModel, setAiModel] = useState("");
  const [aiBaseUrl, setAiBaseUrl] = useState("");
  const [aiKey, setAiKey] = useState("");
  const [codexBridgeEnabled, setCodexBridgeEnabled] = useState(false);
  const [codexPort, setCodexPort] = useState("17642");
  const [codexBridgeRunning, setCodexBridgeRunning] = useState(false);
  const [codexSessionToken, setCodexSessionToken] = useState<string | null>(null);
  const [showCodexSessionToken, setShowCodexSessionToken] = useState(false);
  const [codexHostings, setCodexHostings] = useState<CodexHostingSummary[]>([]);
  const [contextMenuSettings, setContextMenuSettings] = useState<ContextMenuSettings>(DEFAULT_CONTEXT_MENU_SETTINGS);
  const [savingAi, setSavingAi] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [savingCodex, setSavingCodex] = useState(false);
  const { isActivated, licenseKey, activate } = useLicense();
  const { locale, setLocale, languages, t } = useI18n();

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
        setActivationError(result.error ?? t("settings.activationFailed"));
        setTransferAvailable(Boolean(result.canTransfer));
      }
    } catch (e) {
      setActivationError(String(e));
      setTransferAvailable(false);
    } finally {
      setActivating(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    setContextMenuSettings(getContextMenuSettings());

    aiGetSettings()
      .then((settings) => {
        setAiProvider(settings.provider);
        setAiModel(settings.model);
        setAiBaseUrl(settings.baseUrl ?? "");
      })
      .catch(() => {});

    codexGetBridgeSettings()
      .then((settings) => {
        setCodexBridgeEnabled(settings.enabled);
        setCodexPort(String(settings.port));
        setCodexBridgeRunning(Boolean(settings.running));
        setCodexSessionToken(settings.sessionToken ?? null);
      })
      .catch(() => {});
    codexListHostings()
      .then(setCodexHostings)
      .catch(() => setCodexHostings([]));
  }, [open]);

  const saveAi = async () => {
    setSavingAi(true);
    try {
      await aiSaveSettings({
        provider: aiProvider,
        model: aiModel,
        baseUrl: aiBaseUrl || null,
        apiKey: aiKey || null,
      });
      setAiKey("");
      toast.success(t("common.saveChanges"));
    } catch (error) {
      toast.error(String(error));
    } finally {
      setSavingAi(false);
    }
  };

  const testAi = async () => {
    setTestingAi(true);
    try {
      const result = await aiTestSettings();
      toast.success(t("settings.aiConfigured"), { description: result.output });
    } catch (error) {
      toast.error(String(error));
    } finally {
      setTestingAi(false);
    }
  };

  const saveCodex = async () => {
    setSavingCodex(true);
    try {
      const port = Number.parseInt(codexPort, 10);
      const settings = await codexSaveBridgeSettings({
        enabled: codexBridgeEnabled,
        port: Number.isFinite(port) ? port : 17642,
      });
      setCodexPort(String(settings.port));
      setCodexBridgeRunning(Boolean(settings.running));
      setCodexSessionToken(settings.sessionToken ?? null);
      toast.success(t("common.saveChanges"));
    } catch (error) {
      toast.error(String(error));
    } finally {
      setSavingCodex(false);
    }
  };

  const updateShowShortcuts = (value: boolean) => {
    const next = { ...contextMenuSettings, showShortcuts: value };
    setContextMenuSettings(next);
    saveContextMenuSettings(next);
  };

  const updateContextMenuAction = (action: ContextMenuAction, value: boolean) => {
    const next = {
      ...contextMenuSettings,
      actions: {
        ...contextMenuSettings.actions,
        [action]: value,
      },
    };
    setContextMenuSettings(next);
    saveContextMenuSettings(next);
  };

  const resetContextMenu = () => {
    setContextMenuSettings(resetContextMenuSettings());
    toast.success(t("settings.contextMenuResetAll"));
  };

  const sections: Array<{ id: SettingsSection; label: string; icon: React.ReactNode }> = [
    { id: "general", label: t("settings.tabGeneral"), icon: <Settings className="h-4 w-4" /> },
    { id: "appearance", label: t("settings.appearance"), icon: <Eye className="h-4 w-4" /> },
    { id: "context", label: t("settings.contextMenu"), icon: <Menu className="h-4 w-4" /> },
    { id: "ai", label: t("settings.ai"), icon: <Bot className="h-4 w-4" /> },
    { id: "codex", label: t("codex.title"), icon: <Code2 className="h-4 w-4" /> },
    { id: "integrations", label: t("settings.integrations"), icon: <PlugZap className="h-4 w-4" /> },
    { id: "license", label: t("settings.license"), icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onClose();
    }}>
      <DialogContent className="max-h-[calc(100vh-24px)] max-w-[920px] gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 shadow-2xl">
        <div className="grid h-[min(720px,calc(100vh-24px))] min-h-0 grid-cols-[230px_1fr]">
          <aside className="border-r border-border bg-toolbar p-4">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight">{t("settings.title")}</h3>
                <p className="text-[11px] text-muted-foreground">LoFTP</p>
              </div>
            </div>

            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors",
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-panel-header hover:text-foreground"
                  )}
                >
                  {section.icon}
                  <span>{section.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex min-w-0 flex-col bg-card">
            <div className="border-b border-border bg-panel-header px-6 py-4">
              <h4 className="text-lg font-semibold tracking-tight">{sections.find((s) => s.id === activeSection)?.label}</h4>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeSection === "general" && (
                <SettingsCard title={t("settings.language")} icon={<Laptop className="h-4 w-4 text-sky-500" />}>
                  <div className="grid grid-cols-6 gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => setLocale(lang.value)}
                        title={localeMessages[lang.value].meta.nativeName}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-center transition-all",
                          locale === lang.value
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-background hover:bg-file-hover"
                        )}
                      >
                        <span className="text-xl leading-none">{lang.label}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{lang.code}</span>
                      </button>
                    ))}
                  </div>
                </SettingsCard>
              )}

              {activeSection === "appearance" && (
                <SettingsCard title={t("settings.appearance")} icon={<Eye className="h-4 w-4 text-amber-500" />}>
                  <div className="grid grid-cols-2 gap-3">
                    <ThemeOption active={theme === "light"} onClick={() => onThemeChange("light")} icon={<Sun className="h-5 w-5" />} label={t("common.light")} />
                    <ThemeOption active={theme === "dark"} onClick={() => onThemeChange("dark")} icon={<Moon className="h-5 w-5" />} label={t("common.dark")} />
                  </div>
                  <p className="mt-4 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                    {t("settings.appearanceLightPanelsHint")}
                  </p>
                </SettingsCard>
              )}

              {activeSection === "context" && (
                <SettingsCard title={t("settings.contextMenu")} icon={<Menu className="h-4 w-4 text-orange-500" />}>
                  <div className="max-h-[calc(100vh-260px)] space-y-4 overflow-y-auto pr-2">
                    <ContextMenuSettingsGroup title={t("settings.contextMenuAdvanced")}>
                      <ToggleRow
                        label={t("settings.contextMenuShowShortcuts")}
                        checked={contextMenuSettings.showShortcuts}
                        onChange={updateShowShortcuts}
                      />
                    </ContextMenuSettingsGroup>

                    {CONTEXT_MENU_GROUPS.map((group) => (
                      <ContextMenuSettingsGroup key={group.titleKey} title={t(group.titleKey)}>
                        {group.actions.map((action) => (
                          <ToggleRow
                            key={action}
                            label={t(`contextMenu.${action}`)}
                            checked={contextMenuSettings.actions[action]}
                            onChange={(value) => updateContextMenuAction(action, value)}
                          />
                        ))}
                      </ContextMenuSettingsGroup>
                    ))}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={resetContextMenu}
                        className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-file-hover"
                      >
                        {t("settings.contextMenuResetAll")}
                      </button>
                    </div>
                  </div>
                </SettingsCard>
              )}

              {activeSection === "ai" && (
                <SettingsCard title={t("settings.ai")} icon={<Bot className="h-4 w-4 text-emerald-500" />}>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label={t("settings.aiProviders")}>
                      <select value={aiProvider} onChange={(e) => setAiProvider(e.target.value)} className="settings-input">
                        {AI_PROVIDERS.map((provider) => (
                          <option key={provider} value={provider}>{provider}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label={t("settings.aiModel")}>
                      <input value={aiModel} onChange={(e) => setAiModel(e.target.value)} className="settings-input" placeholder={t("settings.aiModelPlaceholder")} />
                    </Field>
                    <Field label={t("settings.aiBaseUrl")}>
                      <input value={aiBaseUrl} onChange={(e) => setAiBaseUrl(e.target.value)} className="settings-input" placeholder={t("settings.aiBaseUrlPlaceholder")} />
                    </Field>
                    <Field label={t("settings.aiApiKey")}>
                      <input value={aiKey} onChange={(e) => setAiKey(e.target.value)} className="settings-input" type="password" placeholder={t("settings.aiApiKeyPlaceholder")} />
                    </Field>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-background px-3 py-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <KeyRound className="h-4 w-4 text-primary" />
                      <span>{t("settings.aiApiKeyConfigured")}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={testAi}
                        disabled={testingAi}
                        className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-file-hover disabled:opacity-40"
                      >
                        {testingAi ? "..." : t("settings.aiTest")}
                      </button>
                      <button
                        type="button"
                        onClick={saveAi}
                        disabled={savingAi || !aiProvider || !aiModel}
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
                      >
                        {savingAi ? "..." : t("common.save")}
                      </button>
                    </div>
                  </div>
                </SettingsCard>
              )}

              {activeSection === "codex" && (
                <SettingsCard title={t("codex.bridge")} icon={<Code2 className="h-4 w-4 text-orange-500" />}>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-3 text-sm">
                      <span>{t("settings.codexBridgeEnable")}</span>
                      <input type="checkbox" checked={codexBridgeEnabled} onChange={(e) => setCodexBridgeEnabled(e.target.checked)} />
                    </label>
                    <Field label={t("settings.codexBridgePort")}>
                      <input value={codexPort} onChange={(e) => setCodexPort(e.target.value)} className="settings-input" />
                    </Field>
                    <div className="rounded-lg border border-border bg-background px-3 py-3 text-xs text-muted-foreground">
                      {t("settings.codexBridgeHint")}
                    </div>
                    <div className="grid gap-2 rounded-lg border border-border bg-background px-3 py-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className={codexBridgeRunning ? "font-semibold text-green-600 dark:text-green-400" : "font-semibold text-muted-foreground"}>
                          {codexBridgeRunning ? "Running on 127.0.0.1" : "Stopped"}
                        </span>
                      </div>
                      {codexSessionToken && (
                        <div className="grid gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Session token</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(codexSessionToken)}
                                className="rounded border border-border px-2 py-1 text-[11px] font-semibold hover:bg-file-hover"
                              >
                                {t("common.copy")}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowCodexSessionToken((value) => !value)}
                                className="rounded border border-border px-2 py-1 text-[11px] font-semibold hover:bg-file-hover"
                              >
                                {showCodexSessionToken ? "Hide" : "Reveal"}
                              </button>
                            </div>
                          </div>
                          <code className="break-all rounded border border-border bg-panel-header px-2 py-1 text-[11px] text-foreground">
                            {showCodexSessionToken ? codexSessionToken : "********-****-****-****-************"}
                          </code>
                        </div>
                      )}
                      <p className="text-muted-foreground">
                        Codex receives profile metadata and file listings only. Passwords, API keys and SSH material stay in LoFTP.
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-background px-3 py-3 text-xs">
                      <div className="mb-2 font-semibold text-foreground">Available profiles</div>
                      <div className="space-y-1 text-muted-foreground">
                        {codexHostings.length === 0 && <div>No profiles saved.</div>}
                        {codexHostings.map((hosting) => (
                          <div key={hosting.id} className="flex items-center justify-between gap-3">
                            <span className="truncate">{hosting.name || hosting.host}</span>
                            <span className="shrink-0 font-mono text-[10px] uppercase">{hosting.protocol}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={saveCodex}
                        disabled={savingCodex}
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
                      >
                        {savingCodex ? "..." : t("common.save")}
                      </button>
                    </div>
                  </div>
                </SettingsCard>
              )}

              {activeSection === "integrations" && (
                <SettingsCard title={locale === "cs" ? "Integrace" : "Integrations"} icon={<PlugZap className="h-4 w-4 text-blue-500" />}>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <CheckRow label={t("contextMenu.openInVsCode")} />
                    <CheckRow label={t("settings.integrationAiApi")} />
                    <CheckRow label={t("settings.integrationCodexBridge")} />
                  </div>
                </SettingsCard>
              )}

              {activeSection === "license" && (
                <SettingsCard title={t("settings.license")} icon={<ShieldCheck className="h-4 w-4 text-lime-600" />}>
                  {isActivated ? (
                    <div className="rounded-lg border border-green-600/20 bg-green-500/10 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        {t("settings.fullVersionActivated")}
                      </div>
                      {licenseKey && <p className="mt-2 font-mono text-[10px] text-muted-foreground">{licenseKey.slice(0, 24)}...</p>}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          value={activationCode}
                          onChange={(e) => setActivationCode(e.target.value)}
                          placeholder="XXXX-LIFE-XXXX-XXXX"
                          className="settings-input font-mono"
                          onKeyDown={(e) => e.key === "Enter" && handleActivate()}
                        />
                        <button
                          onClick={() => handleActivate()}
                          disabled={!activationCode.trim() || activating}
                          className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
                        >
                          {activating ? "..." : t("settings.activate")}
                        </button>
                      </div>
                      {activationError && <p className="text-xs text-destructive">{activationError}</p>}
                      {transferAvailable && (
                        <button
                          onClick={() => handleActivate(true)}
                          disabled={!activationCode.trim() || activating}
                          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-file-hover disabled:opacity-40"
                        >
                          {t("settings.licenseTransfer")}
                        </button>
                      )}
                    </div>
                  )}
                </SettingsCard>
              )}
            </div>

            <footer className="flex justify-end border-t border-border bg-panel-header px-6 py-4">
              <button onClick={onClose} className="rounded-lg border border-border bg-background px-5 py-2 text-xs font-semibold hover:bg-file-hover">
                {t("common.close")}
              </button>
            </footer>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SettingsCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-panel p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h5 className="text-sm font-semibold">{title}</h5>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ThemeOption({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-4 text-left transition-all",
        active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background hover:bg-file-hover"
      )}
    >
      {icon}
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

function ContextMenuSettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-background">
      <div className="border-b border-border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function ToggleRow({
  label,
  checked,
  disabled,
  note,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  note?: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={cn("flex items-center justify-between gap-3 px-3 py-2.5 text-xs font-semibold", disabled && "opacity-55")}>
      <span className="min-w-0">
        <span className="block truncate">{label}</span>
        {note && <span className="block text-[10px] font-normal text-muted-foreground">{note}</span>}
      </span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function CheckRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
      <CheckCircle2 className="h-4 w-4 text-success" />
      <span>{label}</span>
    </div>
  );
}
