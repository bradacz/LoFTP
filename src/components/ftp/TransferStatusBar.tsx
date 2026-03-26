import { Loader2, CheckCircle2, AlertCircle, X, RotateCw } from "lucide-react";
import { TransferItem } from "@/types/ftp";
import { useI18n } from "@/i18n";
import { cancelTransfer } from "@/lib/tauri";

interface TransferStatusBarProps {
  items: TransferItem[];
}

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

export function TransferStatusBar({ items }: TransferStatusBarProps) {
  const { t } = useI18n();
  if (items.length === 0) return null;

  const active = items.filter((i) => i.status === "transferring" || i.status === "pending");
  const transferring = items.filter((i) => i.status === "transferring");
  const allDone = active.length === 0;

  // ── Completed state ──
  if (allDone) {
    const doneCount = items.filter((i) => i.status === "done" || i.status === "cancelled").length;
    const errorCount = items.filter((i) => i.status === "error").length;
    if (doneCount === 0 && errorCount === 0) return null;

    // Error state — persistent with retry
    if (errorCount > 0) {
      const firstError = items.find((i) => i.status === "error");
      return (
        <div className="border-t border-[#27272a] bg-destructive/[0.04]">
          <div className="flex items-center gap-2 px-3 py-1 text-[11px]">
            <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
            <span className="text-destructive/80 truncate flex-1">
              {firstError?.error || t("transferStatus.error")}
            </span>
            {doneCount > 0 && (
              <span className="text-[#52525b] shrink-0">
                {t("transferStatus.completed", { count: doneCount })}
              </span>
            )}
          </div>
        </div>
      );
    }

    // Success state — brief flash before auto-cleanup
    const totalBytes = items.reduce((s, i) => s + (i.totalBytes || i.size || 0), 0);
    return (
      <div className="border-t border-[#27272a]">
        <div className="flex items-center gap-2 px-3 py-1 text-[11px]">
          <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
          <span className="text-foreground font-medium">
            {t("transferStatus.completed", { count: doneCount })} ({formatBytes(totalBytes)})
          </span>
        </div>
      </div>
    );
  }

  // ── Active transfer state ──
  const totalBytes = active.reduce((s, i) => s + (i.totalBytes || i.size || 0), 0);
  const totalTransferred = active.reduce((s, i) => s + (i.bytesTransferred || 0), 0);
  const totalFiles = active.reduce((s, i) => s + (i.totalFiles || 1), 0);
  const completedFiles = active.reduce((s, i) => s + (i.completedFiles || (i.status === "done" ? 1 : 0)), 0);
  const overallPct = totalBytes > 0 ? Math.round((totalTransferred / totalBytes) * 100) : 0;
  const totalSpeed = items.reduce((s, i) => s + (i.speed || 0), 0);
  const totalEta = totalSpeed > 0 ? Math.round((totalBytes - totalTransferred) / totalSpeed) : undefined;

  const currentTransfer = transferring[0];
  const currentFileName = currentTransfer?.currentFileName || currentTransfer?.fileName;
  const currentPct = currentTransfer
    ? currentTransfer.currentFileTotalBytes && currentTransfer.currentFileTotalBytes > 0
      ? Math.round(((currentTransfer.currentFileBytesTransferred || 0) / currentTransfer.currentFileTotalBytes) * 100)
      : currentTransfer.progress
    : 0;

  const handleCancelAll = () => {
    active.forEach((item) => cancelTransfer(item.id));
  };

  return (
    <div className="border-t border-[#27272a]">
      {/* Info row */}
      <div className="flex items-center gap-2 px-3 py-1 text-[11px] text-[#a1a1aa]">
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
        <button
          onClick={handleCancelAll}
          className="p-0.5 rounded hover:bg-[#27272a] shrink-0 transition-colors"
          title={t("transferStatus.cancelAll")}
        >
          <X className="h-3 w-3 text-destructive" />
        </button>
      </div>

      {/* Progress bars */}
      <div className="flex gap-2 px-3 pb-1">
        <div className="flex-1 h-[2px] rounded-full bg-[#1e1e22] overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        {totalFiles > 1 && (
          <div className="w-16 h-[2px] rounded-full bg-[#1e1e22] overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/40 transition-all duration-300"
              style={{ width: `${currentPct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
