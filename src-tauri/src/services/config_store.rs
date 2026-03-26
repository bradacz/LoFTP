use crate::models::hosting::{HostingConfig, StoredHostingConfig};
use crate::models::license::StoredLicense;
use crate::services::credential_store;
use std::fs;
use std::path::PathBuf;

const APP_DIR_NAME: &str = "com.loftp.desktop";
const LEGACY_APP_DIR_NAME: &str = "com.localio.liftp";

fn app_data_dir() -> PathBuf {
    let base = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    let dir = base.join(APP_DIR_NAME);
    fs::create_dir_all(&dir).ok();
    dir
}

fn legacy_app_data_dir() -> PathBuf {
    let base = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    base.join(LEGACY_APP_DIR_NAME)
}

fn hostings_path() -> PathBuf {
    app_data_dir().join("hostings.json")
}

fn license_path() -> PathBuf {
    app_data_dir().join("license.json")
}

// --- Hostings ---

pub fn load_hostings() -> Vec<HostingConfig> {
    let path = hostings_path();
    let (data, migrated_from_legacy) = match fs::read_to_string(&path) {
        Ok(data) => (Some(data), false),
        Err(_) => {
            let legacy_path = legacy_app_data_dir().join("hostings.json");
            (fs::read_to_string(&legacy_path).ok(), true)
        }
    };

    match data {
        Some(data) => {
            let hostings: Vec<HostingConfig> =
                serde_json::from_str::<Vec<StoredHostingConfig>>(&data)
                    .unwrap_or_default()
                    .into_iter()
                    .map(|stored| HostingConfig {
                        id: stored.id.clone(),
                        name: stored.name,
                        host: stored.host,
                        port: stored.port,
                        username: stored.username,
                        password: credential_store::load_hosting_password(&stored.id)
                            .unwrap_or_default(),
                        protocol: stored.protocol,
                        use_tls: stored.use_tls,
                        ssh_key_path: stored.ssh_key_path,
                    })
                    .collect();

            if migrated_from_legacy {
                let _ = save_hostings(&hostings);
            }

            hostings
        }
        None => Vec::new(),
    }
}

pub fn save_hostings(hostings: &[HostingConfig]) -> Result<(), String> {
    let path = hostings_path();
    let stored: Vec<StoredHostingConfig> = hostings
        .iter()
        .map(|hosting| StoredHostingConfig {
            id: hosting.id.clone(),
            name: hosting.name.clone(),
            host: hosting.host.clone(),
            port: hosting.port,
            username: hosting.username.clone(),
            protocol: hosting.protocol.clone(),
            use_tls: hosting.use_tls,
            ssh_key_path: hosting.ssh_key_path.clone(),
        })
        .collect();
    let data = serde_json::to_string_pretty(&stored).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}

// --- Legacy license migration ---

pub fn load_license() -> Option<StoredLicense> {
    let path = license_path();
    let data = match fs::read_to_string(&path) {
        Ok(data) => data,
        Err(_) => {
            let legacy_path = legacy_app_data_dir().join("license.json");
            fs::read_to_string(&legacy_path).ok()?
        }
    };
    serde_json::from_str(&data).ok()
}
