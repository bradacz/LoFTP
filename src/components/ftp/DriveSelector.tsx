import { useState, useEffect, useRef } from "react";
import { HardDrive, Globe, Usb, Home, FolderDown, Monitor, FileText, ChevronDown, Cloud } from "lucide-react";
import { fsListVolumes, VolumeInfo, fsGetHome, fsListCloudStorages, CloudStorageInfo } from "@/lib/tauri";
import { HostingConfig } from "@/types/ftp";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

interface DriveSelectorProps {
  currentMode: "local" | "remote";
  currentPath: string;
  hostings: HostingConfig[];
  activeHost?: HostingConfig | null;
  connectionStatuses: Record<string, string>;
  onSelectVolume: (path: string) => void;
  onSelectHosting: (hosting: HostingConfig) => void;
  onSelectQuickPath: (path: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "";
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

function getVolumeIcon(kind: string) {
  switch (kind) {
    case "internal": return <HardDrive className="h-3.5 w-3.5" />;
    case "external": return <Usb className="h-3.5 w-3.5" />;
    case "disk-image": return <FileText className="h-3.5 w-3.5" />;
    default: return <HardDrive className="h-3.5 w-3.5" />;
  }
}

export function DriveSelector({
  currentMode,
  currentPath,
  hostings,
  activeHost,
  connectionStatuses,
  onSelectVolume,
  onSelectHosting,
  onSelectQuickPath,
}: DriveSelectorProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [volumes, setVolumes] = useState<VolumeInfo[]>([]);
  const [cloudStorages, setCloudStorages] = useState<CloudStorageInfo[]>([]);
  const [homePath, setHomePath] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Load volumes and cloud storages when opened
  useEffect(() => {
    if (!open) return;
    fsListVolumes().then(setVolumes).catch(() => {});
    fsListCloudStorages().then(setCloudStorages).catch(() => {});
    fsGetHome().then(setHomePath).catch(() => {});
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [open]);

  // Current display
  const currentLabel = currentMode === "remote" && activeHost
    ? `${activeHost.name} (${activeHost.protocol.toUpperCase()})`
    : currentPath.split("/").filter(Boolean).pop() || "/";

  const CurrentIcon = currentMode === "remote" ? Globe : Monitor;

  return (
    <div ref={ref} className="relative flex-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-secondary transition-colors text-left"
      >
        <CurrentIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-foreground truncate">{currentLabel}</span>
        <ChevronDown className={cn("h-3 w-3 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 py-1 min-w-[220px] animate-in fade-in-0 zoom-in-95">
          {/* Volumes */}
          <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t("driveSelector.volumes")}</div>
          {volumes.map((vol) => (
            <button
              key={vol.path}
              onClick={() => { onSelectVolume(vol.path); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-file-hover transition-colors text-left",
                currentMode === "local" && currentPath.startsWith(vol.path) && vol.path !== "/" && "bg-file-hover"
              )}
            >
              {getVolumeIcon(vol.kind)}
              <span className="flex-1 truncate">{vol.name}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {formatSize(vol.freeBytes)} {t("driveSelector.free")}
              </span>
            </button>
          ))}

          {/* Cloud storages */}
          {cloudStorages.length > 0 && (
            <>
              <div className="h-px bg-border my-1" />
              <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t("driveSelector.cloud")}</div>
              {cloudStorages.map((cs) => (
                <button
                  key={cs.path}
                  onClick={() => { onSelectVolume(cs.path); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-file-hover transition-colors text-left",
                    currentMode === "local" && currentPath.startsWith(cs.path) && "bg-file-hover"
                  )}
                >
                  <Cloud className="h-3.5 w-3.5" />
                  <span className="flex-1 truncate">{cs.name}</span>
                  <span className="text-[10px] text-muted-foreground">{cs.provider}</span>
                </button>
              ))}
            </>
          )}

          {/* Hostings */}
          {hostings.length > 0 && (
            <>
              <div className="h-px bg-border my-1" />
              <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t("driveSelector.servers")}</div>
              {hostings.map((h) => {
                const status = connectionStatuses[h.id] || "disconnected";
                return (
                  <button
                    key={h.id}
                    onClick={() => { onSelectHosting(h); setOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-file-hover transition-colors text-left",
                      currentMode === "remote" && activeHost?.id === h.id && "bg-file-hover"
                    )}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span className="flex-1 truncate">{h.name || h.host}</span>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      status === "connected" ? "bg-green-500" : status === "error" ? "bg-red-500" : "bg-gray-400"
                    )} />
                    <span className="text-[10px] text-muted-foreground">{h.protocol.toUpperCase()}</span>
                  </button>
                );
              })}
            </>
          )}

          {/* Quick paths */}
          <div className="h-px bg-border my-1" />
          <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t("driveSelector.quickAccess")}</div>
          {homePath && (
            <>
              <button
                onClick={() => { onSelectQuickPath(homePath); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-file-hover transition-colors text-left"
              >
                <Home className="h-3.5 w-3.5" />
                <span className="flex-1">{t("driveSelector.home")}</span>
              </button>
              <button
                onClick={() => { onSelectQuickPath(`${homePath}/Desktop`); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-file-hover transition-colors text-left"
              >
                <Monitor className="h-3.5 w-3.5" />
                <span className="flex-1">{t("driveSelector.desktop")}</span>
              </button>
              <button
                onClick={() => { onSelectQuickPath(`${homePath}/Downloads`); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-file-hover transition-colors text-left"
              >
                <FolderDown className="h-3.5 w-3.5" />
                <span className="flex-1">{t("driveSelector.downloads")}</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
