use crate::models::license::StoredLicense;
use keyring::Entry;

const SERVICE_NAME: &str = "com.loftp.desktop";
const LEGACY_SERVICE_NAME: &str = "com.localio.liftp";

fn hosting_password_entry(service_name: &str, hosting_id: &str) -> Result<Entry, String> {
    Entry::new(service_name, &format!("hosting:{}:password", hosting_id))
        .map_err(|e| format!("Keyring error: {}", e))
}

fn license_entry(service_name: &str) -> Result<Entry, String> {
    Entry::new(service_name, "license:activation").map_err(|e| format!("Keyring error: {}", e))
}

pub fn load_hosting_password(hosting_id: &str) -> Option<String> {
    if let Ok(entry) = hosting_password_entry(SERVICE_NAME, hosting_id) {
        if let Ok(password) = entry.get_password() {
            return Some(password);
        }
    }

    let entry = hosting_password_entry(LEGACY_SERVICE_NAME, hosting_id).ok()?;
    let password = entry.get_password().ok()?;
    let _ = store_hosting_password(hosting_id, &password);
    Some(password)
}

pub fn store_hosting_password(hosting_id: &str, password: &str) -> Result<(), String> {
    let entry = hosting_password_entry(SERVICE_NAME, hosting_id)?;
    entry
        .set_password(password)
        .map_err(|e| format!("Store password failed: {}", e))
}

pub fn delete_hosting_password(hosting_id: &str) -> Result<(), String> {
    for service in [SERVICE_NAME, LEGACY_SERVICE_NAME] {
        let entry = hosting_password_entry(service, hosting_id)?;
        let _ = entry.delete_credential();
    }
    Ok(())
}

pub fn load_license() -> Option<StoredLicense> {
    if let Ok(entry) = license_entry(SERVICE_NAME) {
        if let Ok(raw) = entry.get_password() {
            if let Ok(stored) = serde_json::from_str(&raw) {
                return Some(stored);
            }
        }
    }

    let entry = license_entry(LEGACY_SERVICE_NAME).ok()?;
    let raw = entry.get_password().ok()?;
    let stored = serde_json::from_str(&raw).ok()?;
    let _ = store_license(&stored);
    Some(stored)
}

pub fn store_license(license: &StoredLicense) -> Result<(), String> {
    let entry = license_entry(SERVICE_NAME)?;
    let raw =
        serde_json::to_string(license).map_err(|e| format!("Serialize license failed: {}", e))?;
    entry
        .set_password(&raw)
        .map_err(|e| format!("Store license failed: {}", e))
}

pub fn delete_license() -> Result<(), String> {
    for service in [SERVICE_NAME, LEGACY_SERVICE_NAME] {
        let entry = license_entry(service)?;
        let _ = entry.delete_credential();
    }
    Ok(())
}
