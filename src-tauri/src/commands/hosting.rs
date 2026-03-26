use crate::models::hosting::HostingConfig;
use crate::services::{config_store, credential_store};

#[tauri::command]
pub fn hosting_list() -> Result<Vec<HostingConfig>, String> {
    Ok(config_store::load_hostings())
}

#[tauri::command]
pub fn hosting_save(config: HostingConfig) -> Result<(), String> {
    let mut hostings = config_store::load_hostings();
    let final_config = if let Some(pos) = hostings.iter().position(|h| h.id == config.id) {
        let mut next = config;
        if next.password.is_empty() {
            next.password = hostings[pos].password.clone();
        }
        hostings[pos] = next.clone();
        next
    } else {
        hostings.push(config.clone());
        config
    };

    if !final_config.password.is_empty() {
        credential_store::store_hosting_password(&final_config.id, &final_config.password)?;
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
