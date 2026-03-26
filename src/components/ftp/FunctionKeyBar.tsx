import { useI18n } from "@/i18n";

interface FunctionKeyBarProps {
  onView: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onMove: () => void;
  onNewFolder: () => void;
  onDelete: () => void;
  onSearch: () => void;
}

export function FunctionKeyBar(props: FunctionKeyBarProps) {
  const { t } = useI18n();
  const keys: { key: string; label: string; action: keyof FunctionKeyBarProps }[] = [
    { key: "F3", label: t("functionKeys.view"), action: "onView" },
    { key: "F4", label: t("functionKeys.edit"), action: "onEdit" },
    { key: "F5", label: t("functionKeys.copy"), action: "onCopy" },
    { key: "F6", label: t("functionKeys.move"), action: "onMove" },
    { key: "F7", label: t("functionKeys.folder"), action: "onNewFolder" },
    { key: "F8", label: t("functionKeys.delete"), action: "onDelete" },
    { key: "Alt+F7", label: t("functionKeys.search"), action: "onSearch" },
  ];

  return (
    <div className="flex bg-toolbar border-t-2 border-divider relative z-10">
      {keys.map(({ key, label, action }) => (
        <button
          key={key}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            props[action]();
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] border-r border-toolbar-border last:border-r-0 hover:bg-file-hover active:bg-file-selected transition-colors cursor-pointer"
        >
          <span className="font-bold text-primary">{key}</span>
          <span className="text-muted-foreground">{label}</span>
        </button>
      ))}
    </div>
  );
}
