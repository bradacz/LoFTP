use crate::models::hosting::HostingConfig;
use crate::services::{config_store, credential_store};

#[tauri::command]
pub fn hosting_list() -> Result<Vec<HostingConfig>, String> {
    Ok(config_store::load_hostings())
}

#[tauri::command]
pub fn hosting_save(config: HostingConfig) -> Result<(), String> {
    let mut hostings = config_store::load_hostings();
    let password_to_store = config.password.trim().to_string();
    let mut metadata = config;
    metadata.password = String::new();

    if let Some(pos) = hostings.iter().position(|h| h.id == metadata.id) {
        hostings[pos] = metadata.clone();
    } else {
        hostings.push(metadata.clone());
    }

    if !password_to_store.is_empty() {
        credential_store::store_hosting_password(&metadata.id, &password_to_store)?;
    }

    config_store::save_hostings(&hostings)
}

#[tauri::command]
pub fn hosting_delete(id: String) -> Result<(), String> {
    let mut hostings = config_store::load_hostings();
    hostings.retain(|h| h.id != id);
    credential_store::delete_hosting_password(&id)?;
    config_store::save_hostings(&hostings)
}
