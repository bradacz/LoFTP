use crate::models::license::{CheckoutResponse, VerifyResponse};
use sha2::{Digest, Sha256};

const DEFAULT_LICENSE_API_BASE: &str = "";

fn read_env(name: &str) -> Option<String> {
    std::env::var(name).ok().filter(|value| !value.trim().is_empty())
}

fn license_api_base() -> String {
    read_env("LOCALIOLIFTP_LICENSE_API_BASE")
        .or_else(|| read_env("VITE_LOCALIOLIFTP_LICENSE_API_BASE"))
        .or_else(|| option_env!("LOCALIOLIFTP_LICENSE_API_BASE").map(|value| value.to_string()))
        .or_else(|| option_env!("VITE_LOCALIOLIFTP_LICENSE_API_BASE").map(|value| value.to_string()))
        .unwrap_or_else(|| DEFAULT_LICENSE_API_BASE.to_string())
}

fn stripe_price_id() -> Option<String> {
    read_env("LOCALIOLIFTP_STRIPE_PRICE_ID")
        .or_else(|| read_env("VITE_LOCALIOLIFTP_STRIPE_PRICE_ID"))
        .or_else(|| option_env!("LOCALIOLIFTP_STRIPE_PRICE_ID").map(|value| value.to_string()))
        .or_else(|| option_env!("VITE_LOCALIOLIFTP_STRIPE_PRICE_ID").map(|value| value.to_string()))
}

pub fn generate_installation_hash() -> String {
    let hostname = hostname::get()
        .map(|h| h.to_string_lossy().to_string())
        .unwrap_or_else(|_| "unknown".to_string());

    let mac = get_mac_address();
    let input = format!("{}:{}", hostname, mac);

    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();
    hex::encode(&result[..32])
}

fn get_mac_address() -> String {
    // Use a simple approach - read from system
    match std::process::Command::new("ifconfig").arg("en0").output() {
        Ok(output) => {
            let text = String::from_utf8_lossy(&output.stdout);
            for line in text.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("ether ") {
                    return trimmed.replace("ether ", "").trim().to_string();
                }
            }
            "00:00:00:00:00:00".to_string()
        }
        Err(_) => "00:00:00:00:00:00".to_string(),
    }
}

pub async fn verify_license(
    license_key: &str,
    installation_hash: &str,
    force_transfer: bool,
) -> Result<VerifyResponse, String> {
    let base = license_api_base();
    if base.trim().is_empty() {
        return Err("License API base is not configured".to_string());
    }

    let client = reqwest::Client::new();
    let url = format!("{}/api/v1/license/verify", base);
    let app_version = env!("CARGO_PKG_VERSION");
    let platform = format!("{}-{}", std::env::consts::OS, std::env::consts::ARCH);

    let body = serde_json::json!({
        "licenseKey": license_key,
        "installationHash": installation_hash,
        "forceTransfer": force_transfer,
        "metadata": {
            "platform": platform,
            "app_version": app_version,
            "source": "loftp-desktop"
        }
    });

    let resp = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !resp.status().is_success() {
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Verification failed: {}", text));
    }

    resp.json::<VerifyResponse>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

pub async fn create_checkout(email: &str) -> Result<CheckoutResponse, String> {
    let base = license_api_base();
    if base.trim().is_empty() {
        return Err("License API base is not configured".to_string());
    }

    let client = reqwest::Client::new();
    let url = format!("{}/api/v1/checkout/create", base);
    let price_id = stripe_price_id().unwrap_or_default();
    let installation_hash = generate_installation_hash();
    let app_version = env!("CARGO_PKG_VERSION");
    let platform = format!("{}-{}", std::env::consts::OS, std::env::consts::ARCH);

    if price_id.is_empty() {
        return Err("Missing LOCALIOLIFTP_STRIPE_PRICE_ID for checkout".to_string());
    }

    let body = serde_json::json!({
        "customerEmail": email,
        "priceId": price_id,
        "licenseType": "lifetime",
        "installationHash": installation_hash,
        "metadata": {
            "source": "loftp-desktop",
            "platform": platform,
            "app_version": app_version
        }
    });

    let resp = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !resp.status().is_success() {
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Checkout creation failed: {}", text));
    }

    resp.json::<CheckoutResponse>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}
