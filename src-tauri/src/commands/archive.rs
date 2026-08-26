use crate::commands::viewer::{build_preview_data_url, detect_file_type, FileContent, HexLine};
use crate::models::file_item::FileItem;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fs;
use std::io::{Read, Write};
use std::path::{Component, Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveEntry {
    pub name: String,
    pub size: u64,
    pub is_directory: bool,
    pub modified: String,
}

#[tauri::command]
pub fn archive_list(path: String) -> Result<Vec<ArchiveEntry>, String> {
    let p = Path::new(&path);
    let ext = p
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match ext.as_str() {
        "zip" => list_zip(&path),
        "gz" | "tgz" => {
            // Check if it's .tar.gz
            let stem = p.file_stem().and_then(|s| s.to_str()).unwrap_or("");
            if stem.ends_with(".tar") || ext == "tgz" {
                list_tar_gz(&path)
            } else {
                Err("Unsupported archive format".to_string())
            }
        }
        "tar" => list_tar(&path),
        _ => Err(format!("Unsupported archive format: .{}", ext)),
    }
}

#[tauri::command]
pub fn archive_extract(
    archive_path: String,
    target_dir: String,
    files: Option<Vec<String>>,
    strip_prefix: Option<String>,
) -> Result<(), String> {
    let p = Path::new(&archive_path);
    let ext = p
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    let normalized_strip_prefix = normalize_inner_path(strip_prefix.as_deref());

    fs::create_dir_all(&target_dir).map_err(|e| format!("Create dir failed: {}", e))?;

    match ext.as_str() {
        "zip" => extract_zip(
            &archive_path,
            &target_dir,
            files.as_deref(),
            &normalized_strip_prefix,
        ),
        "gz" | "tgz" => extract_tar_gz(
            &archive_path,
            &target_dir,
            files.as_deref(),
            &normalized_strip_prefix,
        ),
        "tar" => extract_tar(
            &archive_path,
            &target_dir,
            files.as_deref(),
            &normalized_strip_prefix,
        ),
        _ => Err(format!("Unsupported format: .{}", ext)),
    }
}

#[tauri::command]
pub fn archive_create(
    output_path: String,
    source_paths: Vec<String>,
    base_dir: String,
) -> Result<(), String> {
    if Path::new(&output_path).symlink_metadata().is_ok() {
        return Err(format!("Archive already exists: {}", output_path));
    }
    let ext = Path::new(&output_path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match ext.as_str() {
        "zip" => create_zip(&output_path, &source_paths, &base_dir),
        _ => Err("Only ZIP creation is supported".to_string()),
    }
}

#[tauri::command]
pub fn archive_list_dir(path: String, inner_path: Option<String>) -> Result<Vec<FileItem>, String> {
    let normalized_inner = normalize_inner_path(inner_path.as_deref());
    let entries = archive_list(path)?;
    let mut items: BTreeMap<String, FileItem> = BTreeMap::new();

    if !normalized_inner.is_empty() {
        items.insert(
            "..".to_string(),
            FileItem {
                name: "..".to_string(),
                size: 0,
                modified: String::new(),
                is_directory: true,
                permissions: None,
                is_symlink: None,
                symlink_target: None,
                resolved_path: None,
                entry_path: Some(parent_inner_path(&normalized_inner)),
            },
        );
    }

    let prefix = if normalized_inner.is_empty() {
        String::new()
    } else {
        format!("{}/", normalized_inner)
    };

    for entry in entries {
        let entry_name = entry.name.trim_matches('/').to_string();
        if entry_name.is_empty() {
            continue;
        }
        if !prefix.is_empty() && !entry_name.starts_with(&prefix) {
            continue;
        }

        let relative = if prefix.is_empty() {
            entry_name.as_str()
        } else {
            &entry_name[prefix.len()..]
        };

        if relative.is_empty() {
            continue;
        }

        let mut parts = relative.splitn(2, '/');
        let child_name = parts.next().unwrap_or_default();
        let remainder = parts.next();
        if child_name.is_empty() {
            continue;
        }

        let child_entry_path = if normalized_inner.is_empty() {
            child_name.to_string()
        } else {
            format!("{}/{}", normalized_inner, child_name)
        };

        let is_direct_child = remainder.is_none();
        let is_directory = remainder.is_some() || entry.is_directory;

        items
            .entry(child_name.to_string())
            .and_modify(|existing| {
                existing.is_directory = existing.is_directory || is_directory;
                if existing.modified.is_empty() && is_direct_child {
                    existing.modified = entry.modified.clone();
                }
                if existing.size == 0 && is_direct_child && !is_directory {
                    existing.size = entry.size;
                }
            })
            .or_insert_with(|| FileItem {
                name: child_name.to_string(),
                size: if is_direct_child && !is_directory {
                    entry.size
                } else {
                    0
                },
                modified: if is_direct_child {
                    entry.modified.clone()
                } else {
                    String::new()
                },
                is_directory,
                permissions: None,
                is_symlink: None,
                symlink_target: None,
                resolved_path: None,
                entry_path: Some(child_entry_path),
            });
    }

    Ok(items.into_values().collect())
}

#[tauri::command]
pub fn archive_read_text(
    archive_path: String,
    entry_path: String,
    max_bytes: Option<usize>,
) -> Result<FileContent, String> {
    let path_hint = PathBuf::from(&entry_path);
    let file_type = detect_file_type(&path_hint);
    let bytes = read_archive_entry(&archive_path, &entry_path)?;
    let max = max_bytes.unwrap_or(512 * 1024);
    let truncated = &bytes[..bytes.len().min(max)];

    if file_type == "image" || file_type == "pdf" {
        return Ok(FileContent {
            content: String::new(),
            file_type,
            size: bytes.len() as u64,
            encoding: "n/a".to_string(),
            total_lines: 0,
            preview_data_url: build_preview_data_url(&path_hint, truncated),
        });
    }

    let content = String::from_utf8_lossy(truncated).to_string();
    Ok(FileContent {
        content: content.clone(),
        file_type,
        size: bytes.len() as u64,
        encoding: "utf-8".to_string(),
        total_lines: content.lines().count(),
        preview_data_url: None,
    })
}

#[tauri::command]
pub fn archive_read_hex(
    archive_path: String,
    entry_path: String,
    offset: usize,
    length: usize,
) -> Result<Vec<HexLine>, String> {
    let bytes = read_archive_entry(&archive_path, &entry_path)?;
    let end = (offset + length).min(bytes.len());
    let chunk = &bytes[offset..end];

    Ok(chunk
        .chunks(16)
        .enumerate()
        .map(|(i, row)| HexLine {
            offset: offset + i * 16,
            hex: row
                .iter()
                .map(|b| format!("{:02X}", b))
                .collect::<Vec<_>>()
                .join(" "),
            ascii: row
                .iter()
                .map(|b| {
                    if b.is_ascii_graphic() || *b == b' ' {
                        *b as char
                    } else {
                        '.'
                    }
                })
                .collect(),
        })
        .collect())
}

fn normalize_inner_path(inner_path: Option<&str>) -> String {
    inner_path.unwrap_or("/").trim_matches('/').to_string()
}

fn parent_inner_path(inner_path: &str) -> String {
    Path::new(inner_path)
        .parent()
        .map(|parent| parent.to_string_lossy().trim_matches('/').to_string())
        .unwrap_or_default()
}

fn normalize_archive_entry_path(path: &str) -> String {
    path.replace('\\', "/").trim_matches('/').to_string()
}

fn entry_matches_filter(entry_name: &str, files: Option<&[String]>) -> bool {
    let Some(filter) = files else {
        return true;
    };

    filter.iter().any(|selected| {
        let selected = normalize_archive_entry_path(selected);
        !selected.is_empty()
            && (entry_name == selected || entry_name.starts_with(&format!("{}/", selected)))
    })
}

fn strip_archive_prefix(entry_name: &str, strip_prefix: &str) -> String {
    if strip_prefix.is_empty() {
        return entry_name.to_string();
    }

    if entry_name == strip_prefix {
        return String::new();
    }

    let prefix = format!("{}/", strip_prefix);
    entry_name
        .strip_prefix(&prefix)
        .unwrap_or(entry_name)
        .to_string()
}

fn safe_archive_output_path(target: &str, relative_path: &str) -> Result<PathBuf, String> {
    let normalized = normalize_archive_entry_path(relative_path);
    let mut output = PathBuf::from(target);

    if normalized.is_empty() {
        return Ok(output);
    }

    for component in Path::new(&normalized).components() {
        match component {
            Component::Normal(part) => output.push(part),
            Component::CurDir => {}
            _ => return Err(format!("Unsafe archive entry path: {}", relative_path)),
        }
    }

    Ok(output)
}

fn read_archive_entry(archive_path: &str, entry_path: &str) -> Result<Vec<u8>, String> {
    let archive_kind = archive_extension_kind(archive_path)?;
    match archive_kind.as_str() {
        "zip" => read_zip_entry(archive_path, entry_path),
        "tar" => read_tar_entry(archive_path, entry_path),
        "tar.gz" => read_tar_gz_entry(archive_path, entry_path),
        _ => Err(format!("Unsupported archive format: {}", archive_kind)),
    }
}

fn archive_extension_kind(path: &str) -> Result<String, String> {
    let p = Path::new(path);
    let ext = p
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    match ext.as_str() {
        "zip" => Ok("zip".to_string()),
        "tgz" => Ok("tar.gz".to_string()),
        "gz" => {
            let stem = p.file_stem().and_then(|s| s.to_str()).unwrap_or("");
            if stem.ends_with(".tar") {
                Ok("tar.gz".to_string())
            } else {
                Err("Unsupported archive format".to_string())
            }
        }
        "tar" => Ok("tar".to_string()),
        _ => Err(format!("Unsupported archive format: .{}", ext)),
    }
}

fn read_zip_entry(archive_path: &str, entry_path: &str) -> Result<Vec<u8>, String> {
    let file = fs::File::open(archive_path).map_err(|e| format!("Open error: {}", e))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("ZIP error: {}", e))?;
    let normalized = entry_path.trim_matches('/');
    let mut entry = archive
        .by_name(normalized)
        .map_err(|e| format!("ZIP entry error: {}", e))?;
    let mut bytes = Vec::new();
    entry
        .read_to_end(&mut bytes)
        .map_err(|e| format!("Read error: {}", e))?;
    Ok(bytes)
}

fn read_tar_entry(archive_path: &str, entry_path: &str) -> Result<Vec<u8>, String> {
    let file = fs::File::open(archive_path).map_err(|e| format!("Open error: {}", e))?;
    let mut archive = tar::Archive::new(file);
    read_tar_like_entry(&mut archive, entry_path)
}

fn read_tar_gz_entry(archive_path: &str, entry_path: &str) -> Result<Vec<u8>, String> {
    let file = fs::File::open(archive_path).map_err(|e| format!("Open error: {}", e))?;
    let decoder = flate2::read::GzDecoder::new(file);
    let mut archive = tar::Archive::new(decoder);
    read_tar_like_entry(&mut archive, entry_path)
}

fn read_tar_like_entry<R: Read>(
    archive: &mut tar::Archive<R>,
    entry_path: &str,
) -> Result<Vec<u8>, String> {
    let normalized = entry_path.trim_matches('/');
    for entry in archive.entries().map_err(|e| format!("TAR error: {}", e))? {
        let mut entry = entry.map_err(|e| format!("TAR entry error: {}", e))?;
        let path = entry
            .path()
            .map_err(|e| format!("TAR path error: {}", e))?
            .to_string_lossy()
            .trim_matches('/')
            .to_string();
        if path == normalized {
            let mut bytes = Vec::new();
            entry
                .read_to_end(&mut bytes)
                .map_err(|e| format!("Read error: {}", e))?;
            return Ok(bytes);
        }
    }
    Err(format!("Archive entry not found: {}", entry_path))
}

// --- ZIP ---

fn list_zip(path: &str) -> Result<Vec<ArchiveEntry>, String> {
    let file = fs::File::open(path).map_err(|e| format!("Open error: {}", e))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("ZIP error: {}", e))?;
    let mut entries = Vec::new();

    for i in 0..archive.len() {
        let f = archive
            .by_index(i)
            .map_err(|e| format!("ZIP entry error: {}", e))?;
        let modified = f
            .last_modified()
            .and_then(|dt| {
                #[allow(deprecated)]
                dt.to_time().ok().map(|t| {
                    format!(
                        "{:04}-{:02}-{:02} {:02}:{:02}",
                        t.year(),
                        t.month() as u8,
                        t.day(),
                        t.hour(),
                        t.minute()
                    )
                })
            })
            .unwrap_or_default();

        entries.push(ArchiveEntry {
            name: f.name().to_string(),
            size: f.size(),
            is_directory: f.is_dir(),
            modified,
        });
    }

    Ok(entries)
}

fn extract_zip(
    path: &str,
    target: &str,
    files: Option<&[String]>,
    strip_prefix: &str,
) -> Result<(), String> {
    let file = fs::File::open(path).map_err(|e| format!("Open error: {}", e))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("ZIP error: {}", e))?;

    for i in 0..archive.len() {
        let mut f = archive
            .by_index(i)
            .map_err(|e| format!("ZIP entry error: {}", e))?;
        let name = normalize_archive_entry_path(f.name());
        if name.is_empty() {
            continue;
        }

        if !entry_matches_filter(&name, files) {
            continue;
        }

        let relative_name = strip_archive_prefix(&name, strip_prefix);
        let out_path = safe_archive_output_path(target, &relative_name)?;
        if f.is_dir() {
            fs::create_dir_all(&out_path).map_err(|e| format!("Mkdir error: {}", e))?;
        } else {
            if out_path.symlink_metadata().is_ok() {
                return Err(format!(
                    "Extraction target already exists: {}",
                    out_path.display()
                ));
            }
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent).map_err(|e| format!("Mkdir error: {}", e))?;
            }
            let mut out =
                fs::File::create(&out_path).map_err(|e| format!("Create error: {}", e))?;
            std::io::copy(&mut f, &mut out).map_err(|e| format!("Copy error: {}", e))?;
        }
    }

    Ok(())
}

fn create_zip(output: &str, sources: &[String], base_dir: &str) -> Result<(), String> {
    let file = fs::File::create(output).map_err(|e| format!("Create error: {}", e))?;
    let mut zip = zip::ZipWriter::new(file);
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    for source in sources {
        let full_path = Path::new(base_dir).join(source);
        if full_path.is_dir() {
            add_dir_to_zip(&mut zip, &full_path, base_dir, options)?;
        } else {
            let relative = full_path
                .strip_prefix(base_dir)
                .unwrap_or(&full_path)
                .to_string_lossy()
                .to_string();
            zip.start_file(&relative, options)
                .map_err(|e| format!("ZIP start file error: {}", e))?;
            let mut f = fs::File::open(&full_path).map_err(|e| format!("Open error: {}", e))?;
            let mut buf = Vec::new();
            f.read_to_end(&mut buf)
                .map_err(|e| format!("Read error: {}", e))?;
            zip.write_all(&buf)
                .map_err(|e| format!("Write error: {}", e))?;
        }
    }

    zip.finish()
        .map_err(|e| format!("ZIP finish error: {}", e))?;
    Ok(())
}

fn add_dir_to_zip(
    zip: &mut zip::ZipWriter<fs::File>,
    dir: &Path,
    base: &str,
    options: zip::write::SimpleFileOptions,
) -> Result<(), String> {
    for entry in walkdir::WalkDir::new(dir)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        let relative = path
            .strip_prefix(base)
            .unwrap_or(path)
            .to_string_lossy()
            .to_string();

        if path.is_dir() {
            zip.add_directory(&relative, options)
                .map_err(|e| format!("ZIP dir error: {}", e))?;
        } else {
            zip.start_file(&relative, options)
                .map_err(|e| format!("ZIP file error: {}", e))?;
            let mut f = fs::File::open(path).map_err(|e| format!("Open error: {}", e))?;
            let mut buf = Vec::new();
            f.read_to_end(&mut buf)
                .map_err(|e| format!("Read error: {}", e))?;
            zip.write_all(&buf)
                .map_err(|e| format!("Write error: {}", e))?;
        }
    }
    Ok(())
}

// --- TAR ---

fn list_tar(path: &str) -> Result<Vec<ArchiveEntry>, String> {
    let file = fs::File::open(path).map_err(|e| format!("Open error: {}", e))?;
    let mut archive = tar::Archive::new(file);
    let mut entries = Vec::new();

    for entry in archive.entries().map_err(|e| format!("TAR error: {}", e))? {
        let entry = entry.map_err(|e| format!("TAR entry error: {}", e))?;
        let header = entry.header();
        entries.push(ArchiveEntry {
            name: entry
                .path()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default(),
            size: header.size().unwrap_or(0),
            is_directory: header.entry_type().is_dir(),
            modified: header
                .mtime()
                .ok()
                .map(|t| {
                    let dt = chrono::DateTime::from_timestamp(t as i64, 0).unwrap_or_default();
                    dt.format("%Y-%m-%d %H:%M").to_string()
                })
                .unwrap_or_default(),
        });
    }

    Ok(entries)
}

fn list_tar_gz(path: &str) -> Result<Vec<ArchiveEntry>, String> {
    let file = fs::File::open(path).map_err(|e| format!("Open error: {}", e))?;
    let decoder = flate2::read::GzDecoder::new(file);
    let mut archive = tar::Archive::new(decoder);
    let mut entries = Vec::new();

    for entry in archive.entries().map_err(|e| format!("TAR error: {}", e))? {
        let entry = entry.map_err(|e| format!("TAR entry error: {}", e))?;
        let header = entry.header();
        entries.push(ArchiveEntry {
            name: entry
                .path()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default(),
            size: header.size().unwrap_or(0),
            is_directory: header.entry_type().is_dir(),
            modified: header
                .mtime()
                .ok()
                .map(|t| {
                    let dt = chrono::DateTime::from_timestamp(t as i64, 0).unwrap_or_default();
                    dt.format("%Y-%m-%d %H:%M").to_string()
                })
                .unwrap_or_default(),
        });
    }

    Ok(entries)
}

fn extract_tar(
    path: &str,
    target: &str,
    files: Option<&[String]>,
    strip_prefix: &str,
) -> Result<(), String> {
    let file = fs::File::open(path).map_err(|e| format!("Open error: {}", e))?;
    let mut archive = tar::Archive::new(file);
    extract_tar_like(&mut archive, target, files, strip_prefix)
}

fn extract_tar_gz(
    path: &str,
    target: &str,
    files: Option<&[String]>,
    strip_prefix: &str,
) -> Result<(), String> {
    let file = fs::File::open(path).map_err(|e| format!("Open error: {}", e))?;
    let decoder = flate2::read::GzDecoder::new(file);
    let mut archive = tar::Archive::new(decoder);
    extract_tar_like(&mut archive, target, files, strip_prefix)
}

fn extract_tar_like<R: Read>(
    archive: &mut tar::Archive<R>,
    target: &str,
    files: Option<&[String]>,
    strip_prefix: &str,
) -> Result<(), String> {
    for entry in archive.entries().map_err(|e| format!("TAR error: {}", e))? {
        let mut entry = entry.map_err(|e| format!("TAR entry error: {}", e))?;
        let entry_name = entry
            .path()
            .map_err(|e| format!("TAR path error: {}", e))?
            .to_string_lossy()
            .to_string();
        let name = normalize_archive_entry_path(&entry_name);
        if name.is_empty() || !entry_matches_filter(&name, files) {
            continue;
        }

        let relative_name = strip_archive_prefix(&name, strip_prefix);
        let out_path = safe_archive_output_path(target, &relative_name)?;
        let entry_type = entry.header().entry_type();

        if entry_type.is_dir() {
            fs::create_dir_all(&out_path).map_err(|e| format!("Mkdir error: {}", e))?;
        } else if entry_type.is_file() {
            if out_path.symlink_metadata().is_ok() {
                return Err(format!(
                    "Extraction target already exists: {}",
                    out_path.display()
                ));
            }
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent).map_err(|e| format!("Mkdir error: {}", e))?;
            }
            let mut out =
                fs::File::create(&out_path).map_err(|e| format!("Create error: {}", e))?;
            std::io::copy(&mut entry, &mut out).map_err(|e| format!("Copy error: {}", e))?;
        }
    }

    Ok(())
}
