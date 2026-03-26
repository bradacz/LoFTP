import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ChevronDown, ChevronRight, Upload, Download, Copy, Archive,
  Loader2, CheckCircle2, AlertCircle, X,
} from "lucide-react";
import { useI18n } from "@/i18n";
import { TransferItem } from "@/types/ftp";
import { cancelTransfer } from "@/lib/tauri";

export interface TransferOptions {
  mode: "binary" | "ascii" | "auto";
  overwrite: "overwrite" | "skip" | "rename" | "ask" | "overwrite-older";
  resume: boolean;
  preserveTimestamps: boolean;
  preservePermissions: boolean;
  followSymlinks: boolean;
  createDirs: boolean;
  verifyAfterTransfer: boolean;
}

interface TransferDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (options: TransferOptions) => void;
  files: string[];
  fromPath: string;
  toPath: string;
  direction: "upload" | "download" | "local-copy" | "archive-extract";
  transfers: TransferItem[];
  transferring: boolean;
}

const defaultOptions: TransferOptions = {
  mode: "auto",
  overwrite: "overwrite-older",
  resume: true,
  preserveTimestamps: true,
  preservePermissions: false,
  followSymlinks: true,
  createDirs: true,
  verifyAfterTransfer: false,
};

/* ── Helpers ── */

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatSpeed(bytesPerSec?: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return "";
  if (bytesPerSec < 1024) return `${bytesPerSec} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
}

function formatEta(seconds?: number): string {
  if (!seconds || seconds <= 0) return "";
  if (seconds < 60) return `~${Math.ceil(seconds)}s`;
  if (seconds < 3600) return `~${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;
  return `~${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

const DirectionIcon = ({ direction, className }: { direction: TransferDialogProps["direction"]; className?: string }) => {
  const cls = className || "h-3.5 w-3.5 text-white";
  switch (direction) {
    case "upload": return <Upload className={cls} />;
    case "download": return <Download className={cls} />;
    case "archive-extract": return <Archive className={cls} />;
    default: return <Copy className={cls} />;
  }
};

function SignalBars({ speed }: { speed: number }) {
  const bars = speed >= 10 * 1024 * 1024 ? 4 : speed >= 1024 * 1024 ? 3 : speed >= 100 * 1024 ? 2 : 1;
  const color = bars >= 3 ? "text-success" : bars === 2 ? "text-yellow-500" : "text-destructive";
  return (
    <div className={`flex items-end gap-px h-[10px] ${color}`} title={formatSpeed(speed)}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-[2px] rounded-sm ${i <= bars ? "bg-current" : "bg-current/20"}`}
          style={{ height: `${i * 25}%` }}
        />
      ))}
    </div>
  );
}

/* ── Main Component ── */

export function TransferDialog({
  open, onClose, onConfirm, files, fromPath, toPath, direction,
  transfers, transferring,
}: TransferDialogProps) {
  const { t } = useI18n();
  const [options, setOptions] = useState<TransferOptions>(defaultOptions);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = <K extends keyof TransferOptions>(key: K, value: TransferOptions[K]) =>
    setOptions((prev) => ({ ...prev, [key]: value }));

  const dirLabel = direction === "upload"
    ? "Upload"
    : direction === "download"
      ? "Download"
      : direction === "archive-extract"
        ? t("transferDialog.extract")
        : t("transferDialog.copy");

  const actionLabel = direction === "upload"
    ? t("toolbar.upload")
    : direction === "download"
      ? t("toolbar.download")
      : direction === "archive-extract"
        ? t("transferDialog.extract")
        : t("transferDialog.copy");

  const fileCountLabel = files.length === 1
    ? t("transferDialog.fileOne")
    : files.length < 5
      ? t("transferDialog.fileFew")
      : t("transferDialog.fileMany");

  // Transfer state
  const active = transfers.filter((i) => i.status === "transferring" || i.status === "pending");
  const errors = transfers.filter((i) => i.status === "error");
  const doneItems = transfers.filter((i) => i.status === "done" || i.status === "cancelled");
  const isActive = active.length > 0;
  const allDone = transferring && !isActive && transfers.length > 0;

  // Progress stats
  const totalBytes = transfers.reduce((s, i) => s + (i.totalBytes || i.size || 0), 0);
  const totalTransferred = transfers.reduce((s, i) => s + (i.bytesTransferred || 0), 0);
  const totalFiles = transfers.reduce((s, i) => s + (i.totalFiles || 1), 0);
  const completedFiles = transfers.reduce((s, i) => s + (i.completedFiles || (i.status === "done" ? 1 : 0)), 0);
  const overallPct = totalBytes > 0 ? Math.round((totalTransferred / totalBytes) * 100) : 0;
  const totalSpeed = transfers.reduce((s, i) => s + (i.speed || 0), 0);
  const totalEta = totalSpeed > 0 ? Math.round((totalBytes - totalTransferred) / totalSpeed) : undefined;

  const currentTransfer = transfers.find((i) => i.status === "transferring");
  const currentFileName = currentTransfer?.currentFileName || currentTransfer?.fileName;
  const currentPct = currentTransfer
    ? currentTransfer.currentFileTotalBytes && currentTransfer.currentFileTotalBytes > 0
      ? Math.round(((currentTransfer.currentFileBytesTransferred || 0) / currentTransfer.currentFileTotalBytes) * 100)
      : currentTransfer.progress
    : 0;

  const doneBytes = transfers.reduce((s, i) => s + (i.totalBytes || i.size || 0), 0);

  // Auto-close 2s after all done with no errors
  useEffect(() => {
    if (allDone && errors.length === 0) {
      const timer = setTimeout(() => onClose(), 2000);
      return () => clearTimeout(timer);
    }
  }, [allDone, errors.length, onClose]);

  const handleCancelAll = () => {
    active.forEach((item) => cancelTransfer(item.id));
  };

  return (
    <Dialog open={open} onOpenChange={transferring && isActive ? undefined : onClose}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 bg-[#18181b] border-[#27272a] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#1e3a5f] border-b border-[#27272a]">
          <div className="w-[22px] h-[22px] bg-primary rounded flex items-center justify-center shrink-0">
            <DirectionIcon direction={direction} />
          </div>
          <span className="text-[13px] font-semibold text-foreground flex-1">{dirLabel}</span>
          <span className="text-[10px] text-[#94a3b8] bg-white/[0.08] px-2 py-0.5 rounded-full font-medium">
            {files.length} {fileCountLabel}
          </span>
        </div>

        {/* ── OPTIONS (always visible, dimmed when transferring) ── */}
        <div className={`px-3.5 py-3 space-y-2.5 ${transferring ? "opacity-40 pointer-events-none" : ""}`}>
          {/* Paths */}
          <div className="grid grid-cols-[28px_1fr] gap-x-2 gap-y-1 text-[11px]">
            <span className="text-[#71717a] font-semibold uppercase tracking-wide text-right flex items-center justify-end text-[10px]">Z</span>
            <div className="font-mono text-[11px] text-[#a1a1aa] bg-[#0f0f12] px-2 py-[3px] rounded border border-[#27272a] truncate">{fromPath}</div>
            <span className="text-[#71717a] font-semibold uppercase tracking-wide text-right flex items-center justify-end text-[10px]">Do</span>
            <div className="font-mono text-[11px] text-[#a1a1aa] bg-[#0f0f12] px-2 py-[3px] rounded border border-[#27272a] truncate">{toPath}</div>
          </div>

          {/* File list */}
          <div className="bg-[#0f0f12] border border-[#27272a] rounded px-2 py-1.5 font-mono text-[10px] leading-relaxed max-h-[52px] overflow-hidden">
            {files.length <= 8 ? (
              <span className="text-foreground">
                {files.map((f, i) => (
                  <span key={f}>{i > 0 && <span className="text-[#52525b]"> · </span>}{f}</span>
                ))}
              </span>
            ) : (
              <span>
                <span className="text-foreground">
                  {files.slice(0, 6).map((f, i) => (
                    <span key={f}>{i > 0 && <span className="text-[#52525b]"> · </span>}{f}</span>
                  ))}
                </span>
                <span className="text-[#52525b]"> · </span>
                <span className="text-primary">+{files.length - 6} {t("transferDialog.moreFiles")}</span>
              </span>
            )}
          </div>

          {/* Collision policy */}
          <Section label={t("transferDialog.overwriteExisting")}>
            <PillGroup
              options={[
                { value: "overwrite-older", label: t("transferDialog.overwriteOlder") },
                { value: "overwrite", label: t("transferDialog.overwrite") },
                { value: "skip", label: t("transferDialog.skip") },
                { value: "rename", label: t("transferDialog.rename") },
              ]}
              selected={options.overwrite}
              onChange={(v) => set("overwrite", v as TransferOptions["overwrite"])}
            />
          </Section>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-[10px] text-[#52525b] hover:text-[#71717a] transition-colors"
          >
            {showAdvanced ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {t("transferDialog.advancedOptions")}
          </button>

          {showAdvanced && (
            <div className="space-y-2.5">
              <Section label={t("transferDialog.transferMode")}>
                <PillGroup
                  options={[
                    { value: "auto", label: t("transferDialog.auto") },
                    { value: "binary", label: t("transferDialog.binary") },
                    { value: "ascii", label: "ASCII" },
                  ]}
                  selected={options.mode}
                  onChange={(v) => set("mode", v as TransferOptions["mode"])}
                />
              </Section>
              <Section label={t("transferDialog.options")}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-[3px]">
                  <ToggleCheck label={t("transferDialog.resume")} checked={options.resume} onChange={(v) => set("resume", v)} />
                  <ToggleCheck label={t("transferDialog.preserveTimestamps")} checked={options.preserveTimestamps} onChange={(v) => set("preserveTimestamps", v)} />
                  <ToggleCheck label={t("transferDialog.preservePermissions")} checked={options.preservePermissions} onChange={(v) => set("preservePermissions", v)} />
                  <ToggleCheck label={t("transferDialog.followSymlinks")} checked={options.followSymlinks} onChange={(v) => set("followSymlinks", v)} />
                  <ToggleCheck label={t("transferDialog.createDirs")} checked={options.createDirs} onChange={(v) => set("createDirs", v)} />
                  <ToggleCheck label={t("transferDialog.verify")} checked={options.verifyAfterTransfer} onChange={(v) => set("verifyAfterTransfer", v)} />
                </div>
              </Section>
            </div>
          )}
        </div>

        {/* ── STATUS BAR (inside dialog, shown during/after transfer) ── */}
        {transferring && (
          <div className="border-t border-[#27272a]">
            {/* Connecting / waiting for first progress */}
            {transfers.length === 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2 text-[11px] text-[#71717a]">
                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                <span>{t("transferStatus.transferring")}...</span>
              </div>
            )}

            {/* Active transfer */}
            {isActive && (
              <>
                <div className="flex items-center gap-2 px-3.5 py-1.5 text-[11px] text-[#a1a1aa]">
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                  <span className="font-semibold text-foreground shrink-0">{completedFiles}/{totalFiles}</span>
                  <span className="font-mono text-[10px] text-foreground truncate flex-1">{currentFileName}</span>
                  <span className="text-[#71717a] shrink-0">{overallPct}%</span>
                  <span className="font-mono text-[10px] text-[#71717a] shrink-0">
                    {formatBytes(totalTransferred)} / {formatBytes(totalBytes)}
                  </span>
                  {totalSpeed > 0 && (
                    <>
                      <span className="font-mono text-[10px] text-success shrink-0">{formatSpeed(totalSpeed)}</span>
                      <SignalBars speed={totalSpeed} />
                    </>
                  )}
                  {totalEta && totalEta > 0 && (
                    <span className="text-[#52525b] text-[10px] shrink-0">{formatEta(totalEta)}</span>
                  )}
                </div>
                <div className="flex gap-2 px-3.5 pb-1.5">
                  <div className="flex-1 h-[3px] rounded-full bg-[#1e1e22] overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${overallPct}%` }} />
                  </div>
                  {totalFiles > 1 && (
                    <div className="w-16 h-[3px] rounded-full bg-[#1e1e22] overflow-hidden">
                      <div className="h-full rounded-full bg-primary/40 transition-all duration-300" style={{ width: `${currentPct}%` }} />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Done */}
            {allDone && errors.length === 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2 text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                <span className="text-foreground font-medium">
                  {t("transferStatus.completed", { count: doneItems.length })} ({formatBytes(doneBytes)})
                </span>
              </div>
            )}

            {/* Done with errors */}
            {allDone && errors.length > 0 && (
              <div className="px-3.5 py-2 space-y-1.5">
                <div className="flex items-center gap-2 text-[11px]">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <span className="text-destructive font-medium">
                    {t("transferStatus.errors", { count: errors.length })}
                  </span>
                  {doneItems.length > 0 && (
                    <span className="text-[#52525b]">
                      · {t("transferStatus.completed", { count: doneItems.length })}
                    </span>
                  )}
                </div>
                <div className="bg-[#0f0f12] border border-[#27272a] rounded p-1.5 max-h-16 overflow-y-auto">
                  {errors.map((e) => (
                    <div key={e.id} className="text-[10px] text-destructive/70 font-mono truncate">
                      {e.fileName}: {e.error || "Error"}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-1.5 px-3.5 py-2 border-t border-[#27272a] bg-[#0f0f12]">
          {!transferring && (
            <>
              <button
                onClick={onClose}
                className="text-[11px] font-medium px-3.5 py-[5px] rounded border border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:bg-[#27272a] transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => onConfirm(options)}
                className="text-[11px] font-medium px-3.5 py-[5px] rounded border border-primary bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {actionLabel}
              </button>
            </>
          )}
          {transferring && isActive && (
            <button
              onClick={handleCancelAll}
              className="text-[11px] font-medium px-3.5 py-[5px] rounded border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              {t("transferStatus.cancelAll")}
            </button>
          )}
          {transferring && allDone && (
            <button
              onClick={onClose}
              className="text-[11px] font-medium px-3.5 py-[5px] rounded border border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:bg-[#27272a] transition-colors"
            >
              {t("common.close")}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Sub-components ── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5 text-[10px] font-semibold text-[#52525b] uppercase tracking-[1px]">
        {label}
        <div className="flex-1 h-px bg-[#27272a]" />
      </div>
      {children}
    </div>
  );
}

function PillGroup({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`text-[11px] font-medium px-2.5 py-1 rounded border transition-colors ${
            selected === o.value
              ? "bg-[#1e3a5f] border-primary text-[#93c5fd]"
              : "bg-[#09090b] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46] hover:bg-[#18181b]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ToggleCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer group" onClick={() => onChange(!checked)}>
      <div
        className={`w-3 h-3 rounded-sm border flex items-center justify-center text-[9px] transition-colors ${
          checked
            ? "bg-[#1e3a5f] border-primary text-[#93c5fd]"
            : "bg-[#09090b] border-[#3f3f46] group-hover:border-[#52525b]"
        }`}
      >
        {checked && "✓"}
      </div>
      <span className="text-[11px] text-[#a1a1aa]">{label}</span>
    </label>
  );
}
