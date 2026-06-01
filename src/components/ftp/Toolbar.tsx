import {
  RiAddLine,
  RiArchive2Fill,
  RiArrowLeftRightLine,
  RiDeleteBin6Fill,
  RiDownloadCloud2Fill,
  RiEdit2Fill,
  RiFileZipFill,
  RiFolderAddFill,
  RiInformation2Fill,
  RiMenuLine,
  RiPlug2Line,
  RiRefreshLine,
  RiSearch2Line,
  RiSettings3Fill,
  RiUploadCloud2Fill,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export interface ToolbarMenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  shortcut?: string;
  danger?: boolean;
}

export interface ToolbarMenuGroup {
  id: string;
  label: string;
  items: ToolbarMenuItem[];
}

interface ToolbarProps {
  menuGroups: ToolbarMenuGroup[];
  onNewHosting: () => void;
  onRefresh: () => void;
  onDisconnect: () => void;
  onUpload: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onRename: () => void;
  onNewFolder: () => void;
  onSettings: () => void;
  onAbout: () => void;
  onSearch: () => void;
  onCompare: () => void;
  onOpenArchive: () => void;
  onCreateArchive: () => void;
  hasSelection: boolean;
  canOpenArchive: boolean;
  canCreateArchive: boolean;
  isComparing?: boolean;
}

const toolbarIconClassName = "h-4 w-4";

export function Toolbar({
  menuGroups,
  onNewHosting,
  onRefresh,
  onDisconnect,
  onUpload,
  onDownload,
  onDelete,
  onRename,
  onNewFolder,
  onSettings,
  onAbout,
  onSearch,
  onCompare,
  onOpenArchive,
  onCreateArchive,
  hasSelection,
  canOpenArchive,
  canCreateArchive,
  isComparing,
}: ToolbarProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-toolbar border-b border-toolbar-border">
      <ToolbarIconButton icon={<RiAddLine className={toolbarIconClassName} />} label={t("toolbar.newConnection")} onClick={onNewHosting} variant="outline" />
      <ToolbarMenuButton groups={menuGroups} label={t("toolbar.menu")} />
      <ToolbarIconButton icon={<RiRefreshLine className={toolbarIconClassName} />} label={t("toolbar.refresh")} onClick={onRefresh} />
      <ToolbarIconButton
        icon={<RiPlug2Line className={toolbarIconClassName} />}
        label={t("toolbar.disconnect")}
        onClick={onDisconnect}
        className="text-destructive hover:text-destructive"
      />

      <div className="w-px h-5 bg-divider mx-1" />

      <ToolbarIconButton icon={<RiUploadCloud2Fill className={toolbarIconClassName} />} label={t("toolbar.upload")} onClick={onUpload} disabled={!hasSelection} />
      <ToolbarIconButton icon={<RiDownloadCloud2Fill className={toolbarIconClassName} />} label={t("toolbar.download")} onClick={onDownload} disabled={!hasSelection} />

      <div className="w-px h-5 bg-divider mx-1" />

      <ToolbarIconButton icon={<RiFolderAddFill className={toolbarIconClassName} />} label={t("toolbar.folder")} onClick={onNewFolder} />
      <ToolbarIconButton icon={<RiEdit2Fill className={toolbarIconClassName} />} label={t("toolbar.rename")} onClick={onRename} disabled={!hasSelection} />
      <ToolbarIconButton
        icon={<RiDeleteBin6Fill className={toolbarIconClassName} />}
        label={t("toolbar.delete")}
        onClick={onDelete}
        disabled={!hasSelection}
        className="text-destructive hover:text-destructive"
      />

      <div className="w-px h-5 bg-divider mx-1" />

      <ToolbarIconButton icon={<RiSearch2Line className={toolbarIconClassName} />} label={t("toolbar.search")} onClick={onSearch} />
      <ToolbarIconButton
        icon={<RiArrowLeftRightLine className={toolbarIconClassName} />}
        label={t("toolbar.compare")}
        onClick={onCompare}
        variant={isComparing ? "default" : "ghost"}
      />

      <div className="w-px h-5 bg-divider mx-1" />

      <ToolbarIconButton
        icon={<RiArchive2Fill className={toolbarIconClassName} />}
        label={t("toolbar.openArchive")}
        onClick={onOpenArchive}
        disabled={!canOpenArchive}
      />
      <ToolbarIconButton
        icon={<RiFileZipFill className={toolbarIconClassName} />}
        label={t("toolbar.createArchive")}
        onClick={onCreateArchive}
        disabled={!canCreateArchive}
      />

      <div className="flex-1" />

      <ToolbarIconButton icon={<RiSettings3Fill className={toolbarIconClassName} />} label={t("toolbar.settings")} onClick={onSettings} />
      <ToolbarIconButton icon={<RiInformation2Fill className={toolbarIconClassName} />} label={t("toolbar.about")} onClick={onAbout} />
    </div>
  );
}

function ToolbarMenuButton({ groups, label }: { groups: ToolbarMenuGroup[]; label: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          aria-label={label}
          title={label}
        >
          <RiMenuLine className={toolbarIconClassName} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="w-64">
        <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {groups.map((group, index) => (
          <div key={group.id}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs font-medium">
                {group.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-72">
                {group.items.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    disabled={item.disabled}
                    onSelect={() => item.onSelect()}
                    className={cn(
                      "text-xs",
                      item.danger && "text-destructive focus:text-destructive"
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.shortcut && <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ToolbarIconButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

function ToolbarIconButton({
  icon,
  label,
  onClick,
  disabled,
  variant = "ghost",
  className,
}: ToolbarIconButtonProps) {
  return (
    <Tooltip delayDuration={900}>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            variant={variant}
            size="sm"
            onClick={onClick}
            disabled={disabled}
            className={`h-7 w-7 p-0 ${className ?? ""}`}
            aria-label={label}
          >
            {icon}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <span className="text-xs">{label}</span>
      </TooltipContent>
    </Tooltip>
  );
}
