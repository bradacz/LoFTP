import { useState } from "react";
import { PenLine, X, Server } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HostingConfig } from "@/types/ftp";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

interface HostingTabsProps {
  hostings: HostingConfig[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
}

export function HostingTabs({ hostings, activeId, onSelect, onRemove, onEdit }: HostingTabsProps) {
  const [pendingDelete, setPendingDelete] = useState<HostingConfig | null>(null);
  const { t } = useI18n();

  if (hostings.length === 0) {
    return (
      <div className="flex items-center h-9 px-3 text-sm text-muted-foreground italic">
        {t("hostingTabs.empty")}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto px-2 py-1">
      <Server className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-1" />
      {hostings.map((h) => (
        <div
          key={h.id}
          className={cn(
            "flex items-center gap-1 rounded-md text-xs font-medium transition-all shrink-0",
            "border",
            activeId === h.id
              ? "bg-hosting-active text-hosting-active-text border-hosting-active shadow-sm"
              : "bg-hosting-tab text-foreground border-border hover:bg-secondary"
          )}
        >
          <button
            type="button"
            onClick={() => onSelect(h.id)}
            onDoubleClick={() => onEdit(h.id)}
            className="flex items-center px-3 py-1.5 min-w-0"
          >
            <span className="truncate max-w-[120px]">{h.name}</span>
          </button>
          <button
            type="button"
            aria-label={t("hostingTabs.editAria", { name: h.name })}
            className="flex items-center justify-center h-6 w-6 rounded-sm opacity-60 hover:opacity-100 hover:bg-black/10 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(h.id);
            }}
          >
            <PenLine className="h-3 w-3" />
          </button>
          <button
            type="button"
            aria-label={t("hostingTabs.deleteAria", { name: h.name })}
            className="flex items-center justify-center h-6 w-6 rounded-sm opacity-60 hover:opacity-100 hover:bg-black/10 shrink-0 mr-1"
            onClick={(e) => {
              e.stopPropagation();
              setPendingDelete(h);
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("hostingTabs.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? t("hostingTabs.deleteMessage", { name: pendingDelete.name })
                : t("hostingTabs.deleteFallback")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) {
                  onRemove(pendingDelete.id);
                }
                setPendingDelete(null);
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
