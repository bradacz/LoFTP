use crate::services::config_store;
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexBridgeSettings {
    pub enabled: bool,
    pub port: u16,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexHostingSummary {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub protocol: String,
    pub username: String,
}

fn app_data_dir() -> PathBuf {
    let base = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    let dir = base.join("com.loftp.desktop");
    fs::create_dir_all(&dir).ok();
    dir
}

fn settings_path() -> PathBuf {
    app_data_dir().join("codex_bridge.json")
}

#[tauri::command]
pub fn codex_get_bridge_settings() -> CodexBridgeSettings {
    fs::read_to_string(settings_path())
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or(CodexBridgeSettings {
            enabled: false,
            port: 17642,
        })
}

#[tauri::command]
pub fn codex_save_bridge_settings(settings: CodexBridgeSettings) -> Result<CodexBridgeSettings, String> {
    let port = if settings.port == 0 { 17642 } else { settings.port };
    let sanitized = CodexBridgeSettings {
        enabled: settings.enabled,
        port,
    };
    let raw = serde_json::to_string_pretty(&sanitized).map_err(|e| e.to_string())?;
    fs::write(settings_path(), raw).map_err(|e| e.to_string())?;
    Ok(sanitized)
}

#[tauri::command]
pub fn codex_list_hostings() -> Vec<CodexHostingSummary> {
    config_store::load_hostings()
        .into_iter()
        .map(|hosting| CodexHostingSummary {
            id: hosting.id,
            name: hosting.name,
            host: hosting.host,
            port: hosting.port,
            protocol: match hosting.protocol {
                crate::models::hosting::Protocol::Ftp => "ftp".to_string(),
                crate::models::hosting::Protocol::Sftp => "sftp".to_string(),
            },
            username: hosting.username,
        })
        .collect()
}
