import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { LicenseStatus } from "@/types/license";
import { licenseActivate, licenseCheck, licenseGetStatus } from "@/lib/tauri";

interface LicenseContextValue {
  status: LicenseStatus["status"];
  licenseKey?: string;
  licenseType?: string;
  expiresAt?: string;
  features?: string[];
  error?: string;
  canTransfer?: boolean;
  isActivated: boolean;
  isChecking: boolean;
  activate: (key: string, forceTransfer?: boolean) => Promise<LicenseStatus>;
  refresh: () => Promise<LicenseStatus>;
}

const LicenseContext = createContext<LicenseContextValue | null>(null);

export function LicenseProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LicenseStatus>({ status: "checking" });

  useEffect(() => {
    let mounted = true;

    licenseGetStatus()
      .then((initial) => {
        if (mounted) setStatus(initial);
      })
      .catch(() => {
        if (mounted) setStatus({ status: "unlicensed" });
      });

    licenseCheck()
      .then((verified) => {
        if (mounted) setStatus(verified);
      })
      .catch(() => {
        // Keep the locally available status when online validation fails.
      });

    return () => {
      mounted = false;
    };
  }, []);

  const activate = useCallback(async (key: string, forceTransfer?: boolean) => {
    try {
      const result = await licenseActivate(key, forceTransfer);
      setStatus(result);
      return result;
    } catch (e) {
      const errorStatus: LicenseStatus = {
        status: "error",
        error: String(e),
      };
      setStatus(errorStatus);
      throw e;
    }
  }, []);

  const refresh = useCallback(async () => {
    const result = await licenseCheck();
    setStatus(result);
    return result;
  }, []);

  const value = useMemo<LicenseContextValue>(() => ({
    status: status.status,
    licenseKey: status.licenseKey,
    licenseType: status.licenseType,
    expiresAt: status.expiresAt,
    features: status.features,
    error: status.error,
    canTransfer: status.canTransfer,
    isActivated: status.status === "activated",
    isChecking: status.status === "checking",
    activate,
    refresh,
  }), [activate, refresh, status]);

  return <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>;
}

export function useLicense() {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error("useLicense must be used within LicenseProvider");
  }
  return context;
}
