import { Wifi } from "lucide-react";
import { HostingConfig } from "@/types/ftp";

interface AppTitleBarProps {
  activeHost?: HostingConfig | null;
  isConnected: boolean;
}

export function AppTitleBar({ activeHost, isConnected }: AppTitleBarProps) {
  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-center py-2 bg-toolbar border-b border-toolbar-border relative pl-20"
    >
      <p className="text-sm font-semibold text-foreground tracking-tight">LoFTP</p>
      {activeHost && isConnected && (
        <div className="absolute right-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Wifi className="h-3 w-3 text-success" />
          <span>{activeHost.host}</span>
        </div>
      )}
    </div>
  );
}
