import { HostingConfig } from "@/types/ftp";
import { DriveSelector } from "./DriveSelector";

interface PanelHeaderRowProps {
  hostings: HostingConfig[];
  activeHost?: HostingConfig | null;
  connectionStatuses: Record<string, string>;
  leftMode: "local" | "remote";
  rightMode: "local" | "remote";
  leftPath: string;
  rightPath: string;
  onLeftSelectVolume: (path: string) => void;
  onLeftSelectHosting: (hosting: HostingConfig) => void;
  onRightSelectVolume: (path: string) => void;
  onRightSelectHosting: (hosting: HostingConfig) => void;
}

export function PanelHeaderRow({
  hostings,
  activeHost,
  connectionStatuses,
  leftMode,
  rightMode,
  leftPath,
  rightPath,
  onLeftSelectVolume,
  onLeftSelectHosting,
  onRightSelectVolume,
  onRightSelectHosting,
}: PanelHeaderRowProps) {
  return (
    <div className="grid grid-cols-2 gap-0 bg-toolbar border-b border-toolbar-border">
      <div className="flex items-center gap-1 px-2 py-1 border-r border-toolbar-border">
        <DriveSelector
          currentMode={leftMode}
          currentPath={leftPath}
          hostings={hostings}
          activeHost={leftMode === "remote" ? activeHost : null}
          connectionStatuses={connectionStatuses}
          onSelectVolume={onLeftSelectVolume}
          onSelectHosting={onLeftSelectHosting}
          onSelectQuickPath={onLeftSelectVolume}
        />
      </div>
      <div className="flex items-center gap-1 px-2 py-1">
        <DriveSelector
          currentMode={rightMode}
          currentPath={rightPath}
          hostings={hostings}
          activeHost={rightMode === "remote" ? activeHost : null}
          connectionStatuses={connectionStatuses}
          onSelectVolume={onRightSelectVolume}
          onSelectHosting={onRightSelectHosting}
          onSelectQuickPath={onRightSelectVolume}
        />
      </div>
    </div>
  );
}
