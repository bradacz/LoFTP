export type LicenseState = "unlicensed" | "activated" | "expired" | "revoked" | "checking" | "error";

export interface LicenseStatus {
  status: LicenseState;
  licenseKey?: string;
  licenseType?: string;
  expiresAt?: string;
  features?: string[];
  error?: string;
  canTransfer?: boolean;
}

export interface PurchaseCheckout {
  checkoutUrl: string;
  sessionId?: string;
  priceId?: string;
  publishableKey?: string;
  message?: string;
}
