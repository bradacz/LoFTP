import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileItem } from "@/types/ftp";
import { Folder, File } from "lucide-react";
import { useI18n } from "@/i18n";

interface PropertiesDialogProps {
  open: boolean;
  onClose: () => void;
  file: FileItem | null;
  fullPath: string;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function PropertiesDialog({ open, onClose, file, fullPath }: PropertiesDialogProps) {
  const { t } = useI18n();
  if (!file) return null;

  const ext = file.isDirectory ? "" : file.name.includes(".") ? file.name.split(".").pop()?.toUpperCase() || "" : "";

  const rows: { label: string; value: string }[] = [
    { label: t("properties.name"), value: file.name },
    { label: t("properties.path"), value: fullPath },
    { label: t("properties.type"), value: file.isDirectory ? t("properties.folder") : ext ? `${ext} ${t("properties.file").toLowerCase()}` : t("properties.file") },
  ];

  if (!file.isDirectory) {
    rows.push({ label: t("properties.size"), value: `${formatSize(file.size)} (${file.size.toLocaleString()} B)` });
  }

  rows.push({ label: t("properties.modified"), value: file.modified || "—" });

  if (file.permissions) {
    rows.push({ label: t("properties.permissions"), value: file.permissions });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm bg-card">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            {file.isDirectory ? (
              <Folder className="h-4 w-4 text-folder" />
            ) : (
              <File className="h-4 w-4 text-muted-foreground" />
            )}
            {t("properties.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[100px_1fr] gap-2 text-xs">
              <span className="text-muted-foreground font-medium">{row.label}</span>
              <span className="font-mono-file text-foreground break-all">{row.value}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
