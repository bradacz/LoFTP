import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { bunnyStorageTestConnection, ftpTestConnection, sftpTestConnection } from "@/lib/tauri";
import { HostingConfig, HostingProtocol } from "@/types/ftp";
import { open } from "@tauri-apps/plugin-dialog";
import { useI18n } from "@/i18n";

interface HostingDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: HostingConfig) => void;
  editHosting?: HostingConfig | null;
}

export function HostingDialog({ open, onClose, onSave, editHosting }: HostingDialogProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("21");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [protocol, setProtocol] = useState<HostingProtocol>("ftp");
  const [useTls, setUseTls] = useState(false);
  const [sshKeyPath, setSshKeyPath] = useState("");
  const [storageZoneName, setStorageZoneName] = useState("");
  const [pullZoneUrl, setPullZoneUrl] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (editHosting) {
      setName(editHosting.name);
      setHost(editHosting.host);
      setPort(String(editHosting.port));
      setUsername(editHosting.username);
      setPassword(editHosting.password);
      setProtocol(editHosting.protocol === "ftp" && editHosting.useTls ? "ftps" : editHosting.protocol);
      setUseTls(editHosting.useTls ?? false);
      setSshKeyPath(editHosting.sshKeyPath ?? "");
      setStorageZoneName(editHosting.storageZoneName ?? editHosting.username);
      setPullZoneUrl(editHosting.pullZoneUrl ?? "");
    } else {
      setName("");
      setHost("");
      setPort("21");
      setUsername("");
      setPassword("");
      setProtocol("ftp");
      setUseTls(false);
      setSshKeyPath("");
      setStorageZoneName("");
      setPullZoneUrl("");
    }
  }, [editHosting, open]);

  const handleSave = () => {
    if (!canSubmit) return;
    const isBunny = protocol === "bunnyStorage";
    onSave({
      id: editHosting?.id ?? crypto.randomUUID(),
      name,
      host: isBunny ? (host || "storage.bunnycdn.com") : host,
      port: isBunny ? 443 : parseInt(port) || defaultPort(protocol),
      username: isBunny ? storageZoneName : username,
      password,
      protocol,
      useTls: protocol === "ftps" ? true : protocol === "ftp" ? useTls : undefined,
      sshKeyPath: protocol === "sftp" && sshKeyPath ? sshKeyPath : undefined,
      storageZoneName: isBunny ? storageZoneName : undefined,
      pullZoneUrl: isBunny && pullZoneUrl ? pullZoneUrl : undefined,
    });
    onClose();
  };

  const canSubmit = protocol === "bunnyStorage"
    ? !!name && !!storageZoneName && !!password
    : !!name && !!host && !!username;
  const canTest = protocol === "bunnyStorage"
    ? !!storageZoneName && !!password
    : !!host && !!username;

  const handleTestConnection = async () => {
    if (!canTest) return;

    setIsTesting(true);
    try {
      const parsedPort = parseInt(port) || defaultPort(protocol);
      if (protocol === "bunnyStorage") {
        await bunnyStorageTestConnection(host || "storage.bunnycdn.com", storageZoneName, password);
      } else if (protocol === "sftp") {
        await sftpTestConnection(host, parsedPort, username, password, sshKeyPath || undefined);
      } else {
        await ftpTestConnection(host, parsedPort, username, password, protocol === "ftps" || useTls);
      }

      toast.success(t("hostingDialog.connectionOk"), {
        description: t("hostingDialog.connectionOkDescription"),
      });
    } catch (error) {
      toast.error(t("hostingDialog.connectionFailed"), {
        description: String(error),
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-base">{editHosting ? t("hostingDialog.editTitle") : t("hostingDialog.newTitle")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">{t("hostingDialog.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("hostingDialog.namePlaceholder")} className="h-8 text-sm" />
          </div>
          <div className="grid grid-cols-[1fr_80px] gap-2">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                {protocol === "bunnyStorage" ? t("hostingDialog.endpoint") : t("hostingDialog.host")}
              </Label>
              <Input
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder={protocol === "bunnyStorage" ? "storage.bunnycdn.com" : "ftp.example.com"}
                className="h-8 text-sm"
              />
            </div>
            <div className={`grid gap-1.5 ${protocol === "bunnyStorage" ? "hidden" : ""}`}>
              <Label className="text-xs text-muted-foreground">{t("hostingDialog.port")}</Label>
              <Input value={port} onChange={(e) => setPort(e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">{t("hostingDialog.protocol")}</Label>
            <div className="flex flex-wrap gap-2">
              {(["ftp", "ftps", "sftp", "bunnyStorage"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setProtocol(p);
                    setPort(String(defaultPort(p)));
                    if (p === "bunnyStorage" && !host) setHost("storage.bunnycdn.com");
                  }}
                  className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                    protocol === p
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-secondary-foreground border-border"
                  }`}
                >
                  {p === "bunnyStorage" ? "Bunny Storage" : p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {protocol === "bunnyStorage" ? (
            <>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">{t("hostingDialog.storageZoneName")}</Label>
                <Input value={storageZoneName} onChange={(e) => setStorageZoneName(e.target.value)} placeholder="my-storage-zone" className="h-8 text-sm" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">{t("hostingDialog.accessKey")}</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">{t("hostingDialog.pullZoneUrl")}</Label>
                <Input value={pullZoneUrl} onChange={(e) => setPullZoneUrl(e.target.value)} placeholder="https://cdn.example.com" className="h-8 text-sm" />
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">{t("hostingDialog.user")}</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="user" className="h-8 text-sm" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">{t("hostingDialog.password")}</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-8 text-sm" />
              </div>
            </>
          )}
          {protocol === "ftp" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUseTls(!useTls)}
                className={`w-8 h-[18px] rounded-full transition-colors relative ${
                  useTls ? "bg-primary" : "bg-border"
                }`}
              >
                <span className={`block w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute top-[2px] transition-transform ${
                  useTls ? "translate-x-[16px]" : "translate-x-[2px]"
                }`} />
              </button>
              <Label className="text-xs text-muted-foreground">{t("hostingDialog.ftps")}</Label>
            </div>
          )}
          {protocol === "sftp" && (
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">{t("hostingDialog.sshKey")}</Label>
              <div className="flex gap-2">
                <Input
                  value={sshKeyPath}
                  onChange={(e) => setSshKeyPath(e.target.value)}
                  placeholder="~/.ssh/id_rsa"
                  className="h-8 text-sm flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={async () => {
                    const selected = await open({
                      title: t("hostingDialog.chooseKeyTitle"),
                      multiple: false,
                      directory: false,
                    });
                    if (selected) setSshKeyPath(selected as string);
                  }}
                >
                  {t("hostingDialog.chooseKey")}
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={!canTest || isTesting}>
            {isTesting ? t("hostingDialog.testing") : t("hostingDialog.testConnection")}
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>{t("common.cancel")}</Button>
          <Button size="sm" onClick={handleSave} disabled={!canSubmit}>
            {editHosting ? t("common.saveChanges") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function defaultPort(protocol: HostingProtocol): number {
  if (protocol === "sftp") return 22;
  if (protocol === "bunnyStorage") return 443;
  return 21;
}
