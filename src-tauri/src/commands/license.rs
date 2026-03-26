use crate::models::license::{LicenseState, LicenseStatus, StoredLicense};
use crate::services::{config_store, credential_store, license_client};

#[tauri::command]
pub async fn license_activate(
    key: String,
    force_transfer: Option<bool>,
) -> Result<LicenseStatus, String> {
    let hash = get_or_create_installation_hash();
    let response =
        license_client::verify_license(&key, &hash, force_transfer.unwrap_or(false)).await?;
    consume_verify_response(response, key, hash)
}

#[tauri::command]
pub async fn license_check() -> Result<LicenseStatus, String> {
    let Some(stored) = load_stored_license() else {
        return Ok(local_license_status());
    };

    let current_hash = license_client::generate_installation_hash();
    if stored.installation_hash != current_hash {
        return Ok(LicenseStatus {
            status: LicenseState::Unlicensed,
            license_key: None,
            license_type: None,
            expires_at: None,
            features: None,
            error: Some("Aktivace patří jinému zařízení".to_string()),
            can_transfer: Some(false),
        });
    }

    match license_client::verify_license(&stored.license_key, &current_hash, false).await {
        Ok(response) => consume_verify_response(response, stored.license_key, current_hash),
        Err(error) => {
            let mut status = local_license_status();
            if status.status == LicenseState::Activated {
                status.error = Some(error);
                return Ok(status);
            }
            Err(error)
        }
    }
}

#[tauri::command]
pub fn license_get_status() -> LicenseStatus {
    local_license_status()
}

fn get_or_create_installation_hash() -> String {
    if let Some(stored) = load_stored_license() {
        return stored.installation_hash;
    }
    license_client::generate_installation_hash()
}

fn consume_verify_response(
    response: crate::models::license::VerifyResponse,
    license_key: String,
    installation_hash: String,
) -> Result<LicenseStatus, String> {
    let returned_key = response
        .license_key
        .clone()
        .unwrap_or_else(|| license_key.clone());
    let license_type = response
        .license_type
        .clone()
        .or_else(|| Some("lifetime".to_string()));
    let activation_ok = response.ok == Some(true)
        || response.token.is_some()
        || matches!(
            response.status.as_deref(),
            Some("active") | Some("activated") | Some("valid") | Some("ok")
        );

    if activation_ok {
        let stored = StoredLicense {
            license_key: returned_key.clone(),
            installation_hash,
            activated_at: Some(chrono::Utc::now().to_rfc3339()),
            last_verified: Some(chrono::Utc::now().to_rfc3339()),
            license_type: license_type.clone(),
            expires_at: response.expires_at.clone(),
            features: response.features.clone(),
            token: response.token.clone(),
        };
        credential_store::store_license(&stored)?;

        return Ok(LicenseStatus {
            status: LicenseState::Activated,
            license_key: Some(returned_key),
            license_type,
            expires_at: response.expires_at,
            features: Some(response.features),
            error: None,
            can_transfer: Some(false),
        });
    }

    let can_transfer = matches!(
        response.status.as_deref(),
        Some("already_activated")
            | Some("already_activated_on_other_device")
            | Some("device_mismatch")
            | Some("bound_to_other_device")
            | Some("transfer_required")
    );

    let state = match response.status.as_deref() {
        Some("revoked") | Some("refunded") => LicenseState::Revoked,
        Some("expired") => LicenseState::Expired,
        _ if can_transfer => LicenseState::Unlicensed,
        _ => LicenseState::Error,
    };

    if matches!(state, LicenseState::Revoked | LicenseState::Expired) {
        let _ = credential_store::delete_license();
    }

    Ok(LicenseStatus {
        status: state,
        license_key: Some(returned_key),
        license_type,
        expires_at: response.expires_at,
        features: None,
        error: response.message.or_else(|| {
            if can_transfer {
                Some("Licence je aktivní na jiném zařízení. Pokud jste přešli na nový počítač, můžete ji převést.".to_string())
            } else {
                response.status
            }
        }),
        can_transfer: Some(can_transfer),
    })
}

fn local_license_status() -> LicenseStatus {
    let current_hash = license_client::generate_installation_hash();

    match load_stored_license() {
        Some(stored) if stored.installation_hash == current_hash => LicenseStatus {
            status: LicenseState::Activated,
            license_key: Some(stored.license_key),
            license_type: stored.license_type.or_else(|| Some("lifetime".to_string())),
            expires_at: stored.expires_at,
            features: Some(if stored.features.is_empty() {
                vec![
                    "premium".to_string(),
                    "sync".to_string(),
                    "lifetime".to_string(),
                ]
            } else {
                stored.features
            }),
            error: None,
            can_transfer: Some(false),
        },
        Some(_) => LicenseStatus {
            status: LicenseState::Unlicensed,
            license_key: None,
            license_type: None,
            expires_at: None,
            features: None,
            error: Some("Aktivace patří jinému zařízení".to_string()),
            can_transfer: Some(false),
        },
        None => LicenseStatus {
            status: LicenseState::Unlicensed,
            license_key: None,
            license_type: None,
            expires_at: None,
            features: None,
            error: None,
            can_transfer: Some(false),
        },
    }
}

fn load_stored_license() -> Option<StoredLicense> {
    if let Some(stored) = credential_store::load_license() {
        return Some(stored);
    }

    let legacy = config_store::load_license()?;
    let _ = credential_store::store_license(&legacy);
    Some(legacy)
}
