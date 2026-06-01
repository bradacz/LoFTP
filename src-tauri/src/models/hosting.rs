use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HostingConfig {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub protocol: Protocol,
    #[serde(default)]
    pub use_tls: bool,
    #[serde(default)]
    pub ssh_key_path: Option<String>,
    #[serde(default)]
    pub storage_zone_name: Option<String>,
    #[serde(default)]
    pub pull_zone_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredHostingConfig {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub protocol: Protocol,
    #[serde(default)]
    pub use_tls: bool,
    #[serde(default)]
    pub ssh_key_path: Option<String>,
    #[serde(default)]
    pub storage_zone_name: Option<String>,
    #[serde(default)]
    pub pull_zone_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum Protocol {
    Ftp,
    Ftps,
    Sftp,
    BunnyStorage,
}
