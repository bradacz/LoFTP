import { useMemo, useState } from "react";
import { HostingConfig } from "@/types/ftp";
import { toast } from "@/components/ui/sonner";
import { useI18n } from "@/i18n";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface ConnectionLike {
  connect: (config: HostingConfig) => Promise<void>;
  markConnected: (hostingId: string) => void;
  markError: (hostingId: string, error: string) => void;
  disconnect: (hostingId: string, protocol: "ftp" | "sftp") => Promise<void>;
  getStatus: (id: string) => ConnectionStatus;
}

interface RemoteLike {
  loadRoot: (host: HostingConfig) => Promise<void>;
  reset: () => void;
}

interface UseHostingWorkspaceParams {
  hostings: HostingConfig[];
  saveHosting: (config: HostingConfig) => Promise<void>;
  removeHosting: (id: string) => Promise<void>;
  connection: ConnectionLike;
  remote: RemoteLike;
}

export function useHostingWorkspace({
  hostings,
  saveHosting,
  removeHosting,
  connection,
  remote,
}: UseHostingWorkspaceParams) {
  const { t } = useI18n();
  const [activeHostingId, setActiveHostingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHosting, setEditingHosting] = useState<HostingConfig | null>(null);

  const activeHost = useMemo(
    () => hostings.find((hosting) => hosting.id === activeHostingId),
    [activeHostingId, hostings]
  );

  const selectHosting = async (id: string) => {
    setActiveHostingId(id);
    const host = hostings.find((hosting) => hosting.id === id);
    if (!host) return;

    if (connection.getStatus(id) !== "connected") {
      try {
        await connection.connect(host);
        await remote.loadRoot(host);
        connection.markConnected(id);
      } catch (e) {
        remote.reset();
        const message = String(e);
        connection.markError(id, message);
        toast.error(t("toasts.connectionFailed"), {
          description: message,
        });
        console.error("Connection failed:", e);
      }
    }
  };

  const disconnect = () => {
    if (activeHost) {
      connection.disconnect(activeHost.id, activeHost.protocol);
      remote.reset();
    }
    setActiveHostingId(null);
  };

  const save = async (config: HostingConfig) => {
    await saveHosting(config);
    setActiveHostingId(config.id);
    setEditingHosting(null);
    setDialogOpen(false);
  };

  const edit = (id: string) => {
    const hosting = hostings.find((item) => item.id === id);
    if (!hosting) return;
    setEditingHosting(hosting);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingHosting(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingHosting(null);
  };

  const remove = async (id: string) => {
    if (connection.getStatus(id) === "connected") {
      const host = hostings.find((item) => item.id === id);
      if (host) {
        connection.disconnect(id, host.protocol);
      }
    }

    await removeHosting(id);

    if (activeHostingId === id) {
      setActiveHostingId(hostings.filter((hosting) => hosting.id !== id)[0]?.id ?? null);
    }
  };

  return {
    activeHostingId,
    activeHost,
    dialogOpen,
    editingHosting,
    selectHosting,
    disconnect,
    save,
    edit,
    remove,
    openCreate,
    closeDialog,
  };
}
