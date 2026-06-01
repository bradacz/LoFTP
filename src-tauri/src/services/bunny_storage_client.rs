use crate::models::file_item::FileItem;
use reqwest::{Client, Url};
use serde::Deserialize;

#[derive(Clone)]
pub struct BunnyStorageSession {
    client: Client,
    endpoint: String,
    storage_zone_name: String,
    access_key: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct BunnyEntry {
    object_name: String,
    length: Option<u64>,
    last_changed: Option<String>,
    is_directory: bool,
}

impl BunnyStorageSession {
    pub fn new(endpoint: &str, storage_zone_name: &str, access_key: &str) -> Self {
        Self {
            client: Client::new(),
            endpoint: normalize_endpoint(endpoint),
            storage_zone_name: storage_zone_name.trim_matches('/').to_string(),
            access_key: access_key.to_string(),
        }
    }

    pub async fn test_connection(&self) -> Result<(), String> {
        self.list_dir("/").await.map(|_| ())
    }

    pub async fn list_dir(&self, path: &str) -> Result<Vec<FileItem>, String> {
        let url = self.url_for(path, true)?;
        let response = self
            .client
            .get(url)
            .header("AccessKey", &self.access_key)
            .send()
            .await
            .map_err(|e| format!("Bunny list failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Bunny list failed: HTTP {}", response.status()));
        }

        let entries = response
            .json::<Vec<BunnyEntry>>()
            .await
            .map_err(|e| format!("Bunny list parse failed: {}", e))?;

        Ok(entries
            .into_iter()
            .filter(|entry| {
                !entry.object_name.is_empty()
                    && entry.object_name != "."
                    && entry.object_name != ".."
            })
            .map(|entry| FileItem {
                name: entry.object_name.trim_end_matches('/').to_string(),
                size: entry.length.unwrap_or(0),
                modified: format_bunny_time(entry.last_changed.as_deref()),
                is_directory: entry.is_directory,
                permissions: None,
                is_symlink: None,
                symlink_target: None,
                resolved_path: None,
                entry_path: None,
            })
            .collect())
    }

    pub async fn upload_file(&self, local_path: &str, remote_path: &str) -> Result<u64, String> {
        let bytes = tokio::fs::read(local_path)
            .await
            .map_err(|e| format!("Read local file failed: {}", e))?;
        let total = bytes.len() as u64;
        let url = self.url_for(remote_path, false)?;
        let response = self
            .client
            .put(url)
            .header("AccessKey", &self.access_key)
            .header("Content-Type", "application/octet-stream")
            .body(bytes)
            .send()
            .await
            .map_err(|e| format!("Bunny upload failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Bunny upload failed: HTTP {}", response.status()));
        }

        Ok(total)
    }

    pub async fn download_file(&self, remote_path: &str, local_path: &str) -> Result<u64, String> {
        let url = self.url_for(remote_path, false)?;
        let response = self
            .client
            .get(url)
            .header("AccessKey", &self.access_key)
            .send()
            .await
            .map_err(|e| format!("Bunny download failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Bunny download failed: HTTP {}", response.status()));
        }

        if let Some(parent) = std::path::Path::new(local_path).parent() {
            tokio::fs::create_dir_all(parent)
                .await
                .map_err(|e| format!("Create local dir failed: {}", e))?;
        }

        let bytes = response
            .bytes()
            .await
            .map_err(|e| format!("Read Bunny download failed: {}", e))?;
        let total = bytes.len() as u64;
        tokio::fs::write(local_path, bytes)
            .await
            .map_err(|e| format!("Write local file failed: {}", e))?;
        Ok(total)
    }

    pub async fn mkdir(&self, path: &str) -> Result<(), String> {
        let url = self.url_for(path, true)?;
        let response = self
            .client
            .put(url)
            .header("AccessKey", &self.access_key)
            .header("Content-Type", "application/octet-stream")
            .body(Vec::new())
            .send()
            .await
            .map_err(|e| format!("Bunny mkdir failed: {}", e))?;

        if response.status().is_success() {
            Ok(())
        } else {
            Err(format!("Bunny mkdir failed: HTTP {}", response.status()))
        }
    }

    pub async fn delete(&self, path: &str) -> Result<(), String> {
        let url = self.url_for(path, false)?;
        let response = self
            .client
            .delete(url)
            .header("AccessKey", &self.access_key)
            .send()
            .await
            .map_err(|e| format!("Bunny delete failed: {}", e))?;

        if response.status().is_success() {
            Ok(())
        } else {
            Err(format!("Bunny delete failed: HTTP {}", response.status()))
        }
    }

    pub async fn exists(&self, path: &str) -> Result<bool, String> {
        let parent = parent_remote_path(path);
        let target = basename(path);
        if target.is_empty() {
            return Ok(false);
        }
        Ok(self
            .list_dir(&parent)
            .await?
            .iter()
            .any(|item| item.name == target))
    }

    fn url_for(&self, path: &str, trailing_slash: bool) -> Result<Url, String> {
        let mut url = Url::parse(&format!("{}/", self.endpoint.trim_end_matches('/')))
            .map_err(|e| format!("Invalid Bunny endpoint: {}", e))?;
        {
            let mut segments = url
                .path_segments_mut()
                .map_err(|_| "Invalid Bunny endpoint path".to_string())?;
            segments.pop_if_empty();
            segments.push(&self.storage_zone_name);
            for segment in path
                .trim_matches('/')
                .split('/')
                .filter(|segment| !segment.is_empty())
            {
                segments.push(segment);
            }
            if trailing_slash {
                segments.push("");
            }
        }
        Ok(url)
    }
}

fn normalize_endpoint(endpoint: &str) -> String {
    let trimmed = endpoint.trim().trim_end_matches('/');
    if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        trimmed.to_string()
    } else if trimmed.is_empty() {
        "https://storage.bunnycdn.com".to_string()
    } else {
        format!("https://{}", trimmed)
    }
}

fn format_bunny_time(value: Option<&str>) -> String {
    let Some(raw) = value else {
        return "—".to_string();
    };
    chrono::DateTime::parse_from_rfc3339(raw)
        .map(|dt| dt.format("%Y-%m-%d %H:%M").to_string())
        .unwrap_or_else(|_| raw.to_string())
}

fn parent_remote_path(path: &str) -> String {
    let trimmed = path.trim_end_matches('/');
    match trimmed.rsplit_once('/') {
        Some((parent, _)) if !parent.is_empty() => parent.to_string(),
        _ => "/".to_string(),
    }
}

fn basename(path: &str) -> String {
    path.trim_end_matches('/')
        .rsplit('/')
        .next()
        .unwrap_or_default()
        .to_string()
}
