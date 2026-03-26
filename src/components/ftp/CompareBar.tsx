import { CompareResult } from "@/hooks/useDirectoryCompare";
import { Button } from "@/components/ui/button";
import { X, ArrowRightLeft } from "lucide-react";
import { useI18n } from "@/i18n";

interface CompareBarProps {
  result: CompareResult;
  onSyncToRemote: () => void;
  onSyncToLocal: () => void;
  onClose: () => void;
}

export function CompareBar({ result, onSyncToRemote, onSyncToLocal, onClose }: CompareBarProps) {
  const { stats } = result;
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-panel-header border-b border-border text-[11px]">
      <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
      <span className="font-medium text-foreground">{t("compare.title")}</span>
      <span className="text-success">{stats.newer} {t("compare.newer")}</span>
      <span className="text-muted-foreground">|</span>
      <span className="text-yellow-500">{stats.older} {t("compare.older")}</span>
      <span className="text-muted-foreground">|</span>
      <span className="text-blue-400">{stats.sizeDiffers} {t("compare.differs")}</span>
      <span className="text-muted-foreground">|</span>
      <span className="text-primary">{stats.localOnly} {t("compare.localOnly")}</span>
      <span className="text-muted-foreground">|</span>
      <span className="text-destructive">{stats.remoteOnly} {t("compare.remoteOnly")}</span>
      <span className="text-muted-foreground">|</span>
      <span>{stats.same} {t("compare.same")}</span>

      <div className="flex-1" />

      <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={onSyncToRemote}>
        {t("compare.syncToRemote")}
      </Button>
      <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={onSyncToLocal}>
        {t("compare.syncToLocal")}
      </Button>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
