use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LicenseStatus {
    pub status: LicenseState,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub license_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub license_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub features: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub can_transfer: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LicenseState {
    Unlicensed,
    Activated,
    Expired,
    Revoked,
    Checking,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredLicense {
    pub license_key: String,
    pub installation_hash: String,
    pub activated_at: Option<String>,
    pub last_verified: Option<String>,
    #[serde(default)]
    pub license_type: Option<String>,
    #[serde(default)]
    pub expires_at: Option<String>,
    #[serde(default)]
    pub features: Vec<String>,
    #[serde(default)]
    pub token: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyResponse {
    pub ok: Option<bool>,
    pub status: Option<String>,
    pub token: Option<String>,
    pub message: Option<String>,
    #[serde(default)]
    pub features: Vec<String>,
    pub license_key: Option<String>,
    pub license_type: Option<String>,
    pub expires_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckoutResponse {
    pub checkout_url: Option<String>,
    pub url: Option<String>,
    pub session_id: Option<String>,
    pub price_id: Option<String>,
    pub publishable_key: Option<String>,
    pub message: Option<String>,
    pub error: Option<String>,
}
