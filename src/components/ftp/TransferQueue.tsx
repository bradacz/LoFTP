import { ArrowRight, CheckCircle2, AlertCircle, Loader2, Pause, Play, X, RotateCw, ChevronUp, Ban } from "lucide-react";
import { TransferItem } from "@/types/ftp";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { cancelTransfer } from "@/lib/tauri";

interface TransferQueueProps {
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
  if (!bytesPerSec || bytesPerSec <= 0) return "—";
  if (bytesPerSec < 1024) return `${bytesPerSec} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
}

function formatEta(seconds?: number): string {
  if (!seconds || seconds <= 0) return "—";
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function TransferQueue({ items }: TransferQueueProps) {
  const { t } = useI18n();
  if (items.length === 0) return null;

  const active = items.filter((i) => i.status === "transferring").length;
  const pending = items.filter((i) => i.status === "pending").length;
  const done = items.filter((i) => i.status === "done").length;
  const errors = items.filter((i) => i.status === "error").length;
  const totalSpeed = items.reduce((s, i) => s + (i.speed || 0), 0);

  return (
    <div className="border-t border-border bg-panel">
      <div className="px-3 py-1.5 bg-panel-header border-b border-border text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex justify-between items-center">
        <span>{t("transferQueue.title")} ({items.length})</span>
        <span className="normal-case font-normal flex gap-3">
          {totalSpeed > 0 && <span className="text-success">{formatSpeed(totalSpeed)}</span>}
          <span>{t("transferQueue.active")}: {active}</span>
          <span>{t("transferQueue.pending")}: {pending}</span>
          <span>{t("transferQueue.done")}: {done}</span>
          {errors > 0 && <span className="text-destructive">{t("transferQueue.errors")}: {errors}</span>}
        </span>
      </div>
      <div className="max-h-40 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-xs border-b border-border last:border-0",
              item.status === "error" && "bg-destructive/5"
            )}
          >
            <StatusIcon status={item.status} />

            <div className="flex-1 min-w-0">
              <div className="font-mono-file truncate">{item.fileName}</div>
              {item.error && (
                <div className="text-[10px] text-destructive truncate">{item.error}</div>
              )}
            </div>

            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground truncate max-w-[120px] text-[10px]">{item.to}</span>

            {/* Progress bar */}
            <div className="w-24 shrink-0">
              <div className="h-1.5 rounded-full bg-progress-track overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    item.status === "error" ? "bg-destructive" :
                    item.status === "cancelled" ? "bg-muted-foreground" :
                    item.status === "paused" ? "bg-yellow-500" :
                    item.status === "done" ? "bg-success" : "bg-primary"
                  )}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>

            <span className="w-8 text-right text-muted-foreground shrink-0">{item.progress}%</span>

            {/* Speed */}
            <span className="w-16 text-right text-success text-[10px] shrink-0">
              {item.status === "transferring" ? formatSpeed(item.speed) : ""}
            </span>

            {/* ETA */}
            <span className="w-12 text-right text-muted-foreground text-[10px] shrink-0">
              {item.status === "transferring" ? formatEta(item.eta) : ""}
            </span>

            {/* Actions */}
            <div className="flex gap-0.5 shrink-0">
              {item.status === "error" && (
                <button className="p-0.5 rounded hover:bg-secondary" title={t("transferQueue.retry")}>
                  <RotateCw className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
              {item.status === "pending" && (
                <button className="p-0.5 rounded hover:bg-secondary" title={t("transferQueue.moveUp")}>
                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
              {(item.status === "pending" || item.status === "transferring") && (
                <button
                  className="p-0.5 rounded hover:bg-secondary"
                  title={t("transferQueue.cancel")}
                  onClick={() => cancelTransfer(item.id)}
                >
                  <X className="h-3 w-3 text-destructive" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: TransferItem["status"] }) {
  switch (status) {
    case "done":
      return <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />;
    case "error":
      return <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />;
    case "cancelled":
      return <Ban className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
    case "transferring":
      return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />;
    case "paused":
      return <Pause className="h-3.5 w-3.5 text-yellow-500 shrink-0" />;
    default:
      return <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground shrink-0" />;
  }
}
