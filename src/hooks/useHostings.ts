import { useState, useEffect, useCallback } from "react";
import { HostingConfig } from "@/types/ftp";
import { hostingList, hostingSave, hostingDelete } from "@/lib/tauri";

export function useHostings() {
  const [hostings, setHostings] = useState<HostingConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Load hostings on mount
  useEffect(() => {
    hostingList()
      .then((list) => {
        setHostings(list);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const save = useCallback(async (config: HostingConfig) => {
    await hostingSave(config);
    setHostings((prev) => {
      const exists = prev.find((h) => h.id === config.id);
      if (exists) return prev.map((h) => (h.id === config.id ? config : h));
      return [...prev, config];
    });
  }, []);

  const remove = useCallback(async (id: string) => {
    await hostingDelete(id);
    setHostings((prev) => prev.filter((h) => h.id !== id));
  }, []);

  return { hostings, loading, save, remove };
}
