use crate::models::file_item::FileItem;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::ErrorKind;
use std::path::Path;

#[tauri::command]
pub fn fs_list(path: String) -> Result<Vec<FileItem>, String> {
    let dir = resolve_list_path(&path)?;

    let entries = fs::read_dir(&dir).map_err(|e| format_list_error(&path, Some(&dir), &e))?;
    let mut items = Vec::new();

    // Add parent directory entry
    if path != "/" {
        items.push(FileItem {
            name: "..".to_string(),
            size: 0,
            modified: String::new(),
            is_directory: true,
            permissions: None,
            is_symlink: None,
            symlink_target: None,
            resolved_path: None,
            entry_path: None,
        });
    }

    for entry in entries.flatten() {
        let entry_path = entry.path();
        let link_metadata = match fs::symlink_metadata(&entry_path) {
            Ok(m) => m,
            Err(_) => continue,
        };
        let is_symlink = link_metadata.file_type().is_symlink();
        let symlink_target = if is_symlink {
            fs::read_link(&entry_path)
                .ok()
                .map(|target| target.to_string_lossy().to_string())
        } else {
            None
        };
        let resolved_path = if is_symlink {
            fs::canonicalize(&entry_path)
                .ok()
                .map(|target| target.to_string_lossy().to_string())
        } else {
            None
        };
        let metadata = match entry.metadata() {
            Ok(m) => m,
            Err(_) => link_metadata,
        };

        let name = entry.file_name().to_string_lossy().to_string();

        // Skip hidden files starting with .
        if name.starts_with('.') {
            continue;
        }

        let is_directory = metadata.is_dir();
        let size = if is_directory { 0 } else { metadata.len() };

        let modified = metadata
            .modified()
            .ok()
            .and_then(|t| {
                let dt: chrono::DateTime<chrono::Local> = t.into();
                Some(dt.format("%Y-%m-%d %H:%M").to_string())
            })
            .unwrap_or_else(|| "—".to_string());

        items.push(FileItem {
            name,
            size,
            modified,
            is_directory,
            permissions: None,
            is_symlink: is_symlink.then_some(true),
            symlink_target,
            resolved_path,
            entry_path: None,
        });
    }

    // Sort: directories first, then by name
    items.sort_by(|a, b| {
        if a.name == ".." {
            return std::cmp::Ordering::Less;
        }
        if b.name == ".." {
            return std::cmp::Ordering::Greater;
        }
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(items)
}

fn resolve_list_path(path: &str) -> Result<std::path::PathBuf, String> {
    let dir = Path::new(path);
    let metadata = fs::symlink_metadata(dir).map_err(|e| match e.kind() {
        ErrorKind::NotFound => format!("Directory not found: {}", path),
        ErrorKind::PermissionDenied => format!("Access denied: {}", path),
        _ => format!("Unable to access {}: {}", path, e),
    })?;

    let resolved = if metadata.file_type().is_symlink() {
        fs::canonicalize(dir).map_err(|e| format_symlink_error(path, dir, &e))?
    } else {
        dir.to_path_buf()
    };

    if !resolved.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }

    Ok(resolved)
}

fn format_symlink_error(requested_path: &str, symlink_path: &Path, error: &std::io::Error) -> String {
    let target = fs::read_link(symlink_path)
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| "<unknown target>".to_string());

    match error.kind() {
        ErrorKind::PermissionDenied => format!(
            "Access denied while opening {}. The link points to {} and macOS denied access.",
            requested_path, target
        ),
        ErrorKind::NotFound => format!(
            "Broken link: {} points to {}, which was not found.",
            requested_path, target
        ),
        _ => format!(
            "Unable to resolve {} -> {}: {}",
            requested_path, target, error
        ),
    }
}

fn format_list_error(requested_path: &str, resolved_path: Option<&Path>, error: &std::io::Error) -> String {
    let path_label = resolved_path
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|| requested_path.to_string());

    match error.kind() {
        ErrorKind::PermissionDenied => {
            if path_label.contains("/Library/CloudStorage/") {
                format!(
                    "Access denied: {}. macOS blocked access to CloudStorage. If this is OneDrive, grant the app access to that folder and try again.",
                    path_label
                )
            } else {
                format!("Access denied: {}", path_label)
            }
        }
        ErrorKind::NotFound => format!("Directory not found: {}", path_label),
        _ => format!("Read dir failed for {}: {}", path_label, error),
    }
}

#[tauri::command]
pub fn fs_get_home() -> String {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|| "/".to_string())
}

#[tauri::command]
pub fn fs_mkdir(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| format!("Create dir failed: {}", e))
}

#[tauri::command]
pub fn fs_delete(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if p.is_dir() {
        fs::remove_dir_all(p).map_err(|e| format!("Delete dir failed: {}", e))
    } else {
        fs::remove_file(p).map_err(|e| format!("Delete file failed: {}", e))
    }
}

#[tauri::command]
pub fn fs_rename(from: String, to: String) -> Result<(), String> {
    fs::rename(&from, &to).map_err(|e| format!("Rename failed: {}", e))
}

#[tauri::command]
pub fn fs_copy(from: String, to: String) -> Result<(), String> {
    let src = Path::new(&from);
    if !src.exists() {
        return Err(format!("Source not found: {}", from));
    }
    if let Some(parent) = Path::new(&to).parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Create dir failed: {}", e))?;
    }
    fs::copy(&from, &to).map_err(|e| format!("Copy failed: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn fs_copy_dir(from: String, to: String) -> Result<(), String> {
    let src = Path::new(&from);
    if !src.exists() {
        return Err(format!("Source not found: {}", from));
    }
    copy_dir_recursive(src, Path::new(&to))
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    fs::create_dir_all(dst).map_err(|e| format!("Create dir failed: {}", e))?;
    for entry in fs::read_dir(src).map_err(|e| format!("Read dir failed: {}", e))? {
        let entry = entry.map_err(|e| format!("Entry error: {}", e))?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path).map_err(|e| format!("Copy failed: {}", e))?;
        }
    }
    Ok(())
}

// --- Volume listing (macOS) ---

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VolumeInfo {
    pub name: String,
    pub path: String,
    pub kind: String, // "internal", "external", "network", "disk-image"
    pub is_removable: bool,
    pub total_bytes: u64,
    pub free_bytes: u64,
}

#[tauri::command]
pub fn fs_list_volumes() -> Result<Vec<VolumeInfo>, String> {
    let mut volumes = Vec::new();

    // Always include the root volume (Macintosh HD)
    if let Ok(stat) = fs2_statvfs("/") {
        volumes.push(VolumeInfo {
            name: "Macintosh HD".to_string(),
            path: "/".to_string(),
            kind: "internal".to_string(),
            is_removable: false,
            total_bytes: stat.0,
            free_bytes: stat.1,
        });
    }

    // Scan /Volumes for mounted drives
    let volumes_dir = Path::new("/Volumes");
    if let Ok(entries) = fs::read_dir(volumes_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            let name = entry.file_name().to_string_lossy().to_string();
            // Skip "Macintosh HD" symlink in /Volumes
            if name == "Macintosh HD" {
                continue;
            }

            let full_path = path.to_string_lossy().to_string();
            let (total, free) = fs2_statvfs(&full_path).unwrap_or((0, 0));

            // Guess kind from path characteristics
            let kind = if name.contains("Time Machine") || name.contains("Backup") {
                "external"
            } else if path.join(".disk_label").exists() || path.join(".VolumeIcon.icns").exists() {
                "disk-image"
            } else {
                "external"
            };

            volumes.push(VolumeInfo {
                name,
                path: full_path,
                kind: kind.to_string(),
                is_removable: true,
                total_bytes: total,
                free_bytes: free,
            });
        }
    }

    Ok(volumes)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloudStorageInfo {
    pub name: String,
    pub path: String,
    pub provider: String,
}

#[tauri::command]
pub fn fs_list_cloud_storages() -> Result<Vec<CloudStorageInfo>, String> {
    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;
    let mut storages = Vec::new();

    // Scan ~/Library/CloudStorage/ for OneDrive, Google Drive, Dropbox, etc.
    let cloud_storage = home.join("Library/CloudStorage");
    if cloud_storage.is_dir() {
        if let Ok(entries) = fs::read_dir(&cloud_storage) {
            for entry in entries.flatten() {
                let path = entry.path();
                if !path.is_dir() {
                    continue;
                }
                let dir_name = entry.file_name().to_string_lossy().to_string();
                // Skip hidden dirs
                if dir_name.starts_with('.') {
                    continue;
                }

                let (provider, display_name) = if dir_name.starts_with("OneDrive") {
                    ("onedrive", pretty_cloud_name(&dir_name, "OneDrive"))
                } else if dir_name.starts_with("GoogleDrive") {
                    ("google-drive", pretty_cloud_name(&dir_name, "Google Drive"))
                } else if dir_name.starts_with("Dropbox") {
                    ("dropbox", pretty_cloud_name(&dir_name, "Dropbox"))
                } else if dir_name.starts_with("Box") {
                    ("box", pretty_cloud_name(&dir_name, "Box"))
                } else if dir_name.starts_with("pCloud") {
                    ("pcloud", pretty_cloud_name(&dir_name, "pCloud"))
                } else {
                    ("cloud", dir_name.clone())
                };

                storages.push(CloudStorageInfo {
                    name: display_name,
                    path: path.to_string_lossy().to_string(),
                    provider: provider.to_string(),
                });
            }
        }
    }

    // Check iCloud Drive
    let icloud = home.join("Library/Mobile Documents/com~apple~CloudDocs");
    if icloud.is_dir() {
        storages.push(CloudStorageInfo {
            name: "iCloud Drive".to_string(),
            path: icloud.to_string_lossy().to_string(),
            provider: "icloud".to_string(),
        });
    }

    Ok(storages)
}

/// Extract a readable display name from CloudStorage directory name
/// e.g. "OneDrive-Personal" → "OneDrive (Personal)", "GoogleDrive-user@gmail.com" → "Google Drive (user@gmail.com)"
fn pretty_cloud_name(dir_name: &str, base: &str) -> String {
    // Directory names are like "OneDrive-Personal", "GoogleDrive-user@example.com"
    let prefix_len = dir_name.find('-').unwrap_or(dir_name.len());
    let suffix = &dir_name[prefix_len..].trim_start_matches('-');
    if suffix.is_empty() {
        base.to_string()
    } else {
        format!("{} ({})", base, suffix)
    }
}

/// Get total and free bytes for a path using statvfs
fn fs2_statvfs(path: &str) -> Result<(u64, u64), String> {
    use std::ffi::CString;
    use std::mem::MaybeUninit;

    let c_path = CString::new(path).map_err(|e| format!("Invalid path: {}", e))?;
    let mut stat = MaybeUninit::<libc::statvfs>::uninit();

    let result = unsafe { libc::statvfs(c_path.as_ptr(), stat.as_mut_ptr()) };
    if result != 0 {
        return Err("statvfs failed".to_string());
    }

    let stat = unsafe { stat.assume_init() };
    let total = stat.f_blocks as u64 * stat.f_frsize as u64;
    let free = stat.f_bavail as u64 * stat.f_frsize as u64;
    Ok((total, free))
}
