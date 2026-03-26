use base64::engine::general_purpose::STANDARD as BASE64_STANDARD;
use base64::Engine;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileContent {
    pub content: String,
    pub file_type: String, // "text", "binary", "image", "pdf"
    pub size: u64,
    pub encoding: String,
    pub total_lines: usize,
    pub preview_data_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HexLine {
    pub offset: usize,
    pub hex: String,
    pub ascii: String,
}

#[tauri::command]
pub fn fs_write_text(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content.as_bytes()).map_err(|e| format!("Write error: {}", e))
}

pub(crate) fn detect_file_type(path: &Path) -> String {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match ext.as_str() {
        "png" | "jpg" | "jpeg" | "gif" | "webp" | "svg" | "ico" | "bmp" => "image".to_string(),
        "pdf" => "pdf".to_string(),
        "rs" | "ts" | "tsx" | "js" | "jsx" | "json" | "html" | "css" | "scss" | "md" | "txt"
        | "toml" | "yaml" | "yml" | "xml" | "sh" | "bash" | "zsh" | "py" | "rb" | "go"
        | "java" | "c" | "cpp" | "h" | "hpp" | "sql" | "csv" | "env" | "gitignore"
        | "editorconfig" | "lock" | "cfg" | "ini" | "conf" | "log" | "php" | "swift"
        | "kt" | "vue" | "svelte" => "text".to_string(),
        _ => {
            // Try reading first bytes to detect
            if let Ok(bytes) = fs::read(path) {
                let sample = &bytes[..bytes.len().min(512)];
                if sample.iter().all(|b| b.is_ascii() || *b > 127) {
                    "text".to_string()
                } else {
                    "binary".to_string()
                }
            } else {
                "binary".to_string()
            }
        }
    }
}

#[tauri::command]
pub fn fs_read_text(path: String, max_bytes: Option<usize>) -> Result<FileContent, String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err(format!("File not found: {}", path));
    }

    let metadata = fs::metadata(&p).map_err(|e| format!("Metadata error: {}", e))?;
    let file_type = detect_file_type(p);
    let max = max_bytes.unwrap_or(512 * 1024); // 512KB default

    if file_type == "image" || file_type == "pdf" {
        let bytes = fs::read(&p).map_err(|e| format!("Read error: {}", e))?;
        let truncated = &bytes[..bytes.len().min(max)];
        return Ok(FileContent {
            content: String::new(),
            file_type,
            size: metadata.len(),
            encoding: "n/a".to_string(),
            total_lines: 0,
            preview_data_url: build_preview_data_url(p, truncated),
        });
    }

    let bytes = fs::read(&p).map_err(|e| format!("Read error: {}", e))?;
    let truncated = &bytes[..bytes.len().min(max)];

    // Try UTF-8 first
    let content = String::from_utf8_lossy(truncated).to_string();
    let total_lines = content.lines().count();

    Ok(FileContent {
        content,
        file_type,
        size: metadata.len(),
        encoding: "utf-8".to_string(),
        total_lines,
        preview_data_url: None,
    })
}

#[tauri::command]
pub fn fs_read_hex(path: String, offset: usize, length: usize) -> Result<Vec<HexLine>, String> {
    let p = Path::new(&path);
    let bytes = fs::read(&p).map_err(|e| format!("Read error: {}", e))?;

    let end = (offset + length).min(bytes.len());
    let chunk = &bytes[offset..end];

    let lines: Vec<HexLine> = chunk
        .chunks(16)
        .enumerate()
        .map(|(i, row)| {
            let hex = row
                .iter()
                .map(|b| format!("{:02X}", b))
                .collect::<Vec<_>>()
                .join(" ");
            let ascii = row
                .iter()
                .map(|b| if b.is_ascii_graphic() || *b == b' ' { *b as char } else { '.' })
                .collect();
            HexLine {
                offset: offset + i * 16,
                hex,
                ascii,
            }
        })
        .collect();

    Ok(lines)
}

pub(crate) fn build_preview_data_url(path: &Path, bytes: &[u8]) -> Option<String> {
    let mime = match path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_lowercase()
        .as_str()
    {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        "ico" => "image/x-icon",
        "bmp" => "image/bmp",
        "pdf" => "application/pdf",
        _ => return None,
    };

    Some(format!(
        "data:{};base64,{}",
        mime,
        BASE64_STANDARD.encode(bytes)
    ))
}
