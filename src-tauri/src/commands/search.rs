use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchOptions {
    pub name_pattern: String,
    pub content_pattern: Option<String>,
    pub recursive: bool,
    pub case_sensitive: bool,
    pub min_size: Option<u64>,
    pub max_size: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub modified: String,
    pub is_directory: bool,
    pub match_line: Option<String>,
}

fn matches_glob(pattern: &str, name: &str, case_sensitive: bool) -> bool {
    let (p, n) = if case_sensitive {
        (pattern.to_string(), name.to_string())
    } else {
        (pattern.to_lowercase(), name.to_lowercase())
    };
    glob_match::glob_match(&p, &n)
}

#[tauri::command]
pub async fn fs_search(
    path: String,
    options: SearchOptions,
) -> Result<Vec<SearchResult>, String> {
    let base = Path::new(&path);
    if !base.exists() {
        return Err(format!("Directory not found: {}", path));
    }

    let mut results = Vec::new();
    let max_results = 1000;

    let walker = if options.recursive {
        WalkDir::new(base).follow_links(true)
    } else {
        WalkDir::new(base).max_depth(1).follow_links(true)
    };

    for entry in walker.into_iter().filter_map(|e| e.ok()) {
        if results.len() >= max_results {
            break;
        }

        let entry_path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        // Skip hidden files and the base directory itself
        if name.starts_with('.') || entry_path == base {
            continue;
        }

        // Name pattern match
        if !options.name_pattern.is_empty()
            && !matches_glob(&options.name_pattern, &name, options.case_sensitive)
        {
            continue;
        }

        let metadata = match entry.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };

        let size = if metadata.is_dir() { 0 } else { metadata.len() };

        // Size filter
        if let Some(min) = options.min_size {
            if size < min {
                continue;
            }
        }
        if let Some(max) = options.max_size {
            if size > max {
                continue;
            }
        }

        // Content search (only for files)
        let mut match_line = None;
        if let Some(ref content_pat) = options.content_pattern {
            if !content_pat.is_empty() && !metadata.is_dir() {
                // Only search text files up to 10MB
                if size > 10 * 1024 * 1024 {
                    continue;
                }
                match fs::read_to_string(entry_path) {
                    Ok(content) => {
                        let found = if options.case_sensitive {
                            content.lines().find(|l| l.contains(content_pat.as_str()))
                        } else {
                            let lower_pat = content_pat.to_lowercase();
                            content
                                .lines()
                                .find(|l| l.to_lowercase().contains(&lower_pat))
                        };
                        match found {
                            Some(line) => {
                                match_line = Some(line.trim().chars().take(200).collect());
                            }
                            None => continue,
                        }
                    }
                    Err(_) => continue, // Binary file or unreadable
                }
            }
        }

        let modified = metadata
            .modified()
            .ok()
            .and_then(|t| {
                let dt: chrono::DateTime<chrono::Local> = t.into();
                Some(dt.format("%Y-%m-%d %H:%M").to_string())
            })
            .unwrap_or_default();

        results.push(SearchResult {
            path: entry_path.to_string_lossy().to_string(),
            name,
            size,
            modified,
            is_directory: metadata.is_dir(),
            match_line,
        });
    }

    Ok(results)
}
