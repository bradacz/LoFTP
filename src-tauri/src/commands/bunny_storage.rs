use crate::models::file_item::FileItem;
use crate::models::transfer::{
    is_cancelled, CancellationState, TransferOptions, TransferProgress, TransferRegistry,
    TransferStatus,
};
use crate::services::{bunny_storage_client::BunnyStorageSession, credential_store};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};

pub struct BunnyStorageState {
    pub sessions: Mutex<HashMap<String, BunnyStorageSession>>,
}

#[derive(Debug)]
struct LocalDirEntry {
    rel_path: String,
    full_path: String,
}

#[derive(Clone)]
struct ProgressSnapshot {
    file_name: String,
    bytes_transferred: u64,
    total_bytes: u64,
    current_file_name: Option<String>,
    current_file_bytes_transferred: Option<u64>,
    current_file_total_bytes: Option<u64>,
    completed_files: Option<u64>,
    total_files: Option<u64>,
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct DeleteProgress {
    delete_id: String,
    path: String,
    item_name: String,
}

impl BunnyStorageState {
    pub fn new() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
        }
    }
}

#[tauri::command]
pub async fn bunny_storage_connect(
    state: State<'_, BunnyStorageState>,
    hosting_id: String,
    endpoint: String,
    storage_zone_name: String,
    access_key: String,
) -> Result<(), String> {
    let resolved_access_key = resolve_access_key(&hosting_id, access_key)?;
    let session = BunnyStorageSession::new(&endpoint, &storage_zone_name, &resolved_access_key);
    session.test_connection().await?;
    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    sessions.insert(hosting_id, session);
    Ok(())
}

#[tauri::command]
pub async fn bunny_storage_test_connection(
    endpoint: String,
    storage_zone_name: String,
    access_key: String,
) -> Result<(), String> {
    BunnyStorageSession::new(&endpoint, &storage_zone_name, &access_key)
        .test_connection()
        .await
}

fn resolve_access_key(hosting_id: &str, access_key: String) -> Result<String, String> {
    if !access_key.is_empty() {
        return Ok(access_key);
    }

    credential_store::load_hosting_password(hosting_id)
        .ok_or_else(|| "Bunny Storage access key is not configured.".to_string())
}

#[tauri::command]
pub async fn bunny_storage_list(
    state: State<'_, BunnyStorageState>,
    hosting_id: String,
    path: String,
) -> Result<Vec<FileItem>, String> {
    let session = get_session(&state, &hosting_id)?;
    session.list_dir(&path).await
}

#[tauri::command]
pub async fn bunny_storage_upload(
    app: AppHandle,
    state: State<'_, BunnyStorageState>,
    cancel_state: State<'_, CancellationState>,
    hosting_id: String,
    local_path: String,
    remote_path: String,
    transfer_id: String,
    options: Option<TransferOptions>,
) -> Result<(), String> {
    let session = get_session(&state, &hosting_id)?;
    let cancel_token = cancel_state.register(&transfer_id);
    let file_name = path_label(&local_path);
    let total_bytes = std::fs::metadata(&local_path).map(|m| m.len()).unwrap_or(0);
    if should_skip_remote(&session, &remote_path, &local_path, &options).await? {
        cancel_state.remove(&transfer_id);
        emit_finish(&app, &transfer_id, &file_name, total_bytes, true);
        return Ok(());
    }
    let final_remote_path = resolve_remote_target(&session, &remote_path, &options).await?;

    emit_progress(
        &app,
        &transfer_id,
        0,
        TransferStatus::Transferring,
        ProgressSnapshot::single_file(&file_name, 0, total_bytes),
    );

    if is_cancelled(&cancel_token) {
        cancel_state.remove(&transfer_id);
        emit_cancelled(&app, &transfer_id, &file_name, total_bytes);
        return Err("Transfer cancelled".to_string());
    }

    let progress_app = app.clone();
    let progress_transfer_id = transfer_id.clone();
    let progress_file_name = file_name.clone();
    let result = session
        .upload_file_with_progress(
            &local_path,
            &final_remote_path,
            move |sent, total| {
                emit_progress(
                    &progress_app,
                    &progress_transfer_id,
                    percentage(sent, total),
                    TransferStatus::Transferring,
                    ProgressSnapshot::single_file(&progress_file_name, sent, total),
                );
            },
            Some(cancel_token.clone()),
        )
        .await;
    cancel_state.remove(&transfer_id);
    if is_cancelled(&cancel_token) {
        emit_cancelled(&app, &transfer_id, &file_name, total_bytes);
    } else {
        emit_finish(&app, &transfer_id, &file_name, total_bytes, result.is_ok());
    }
    result.map(|_| ())
}

#[tauri::command]
pub async fn bunny_storage_download(
    app: AppHandle,
    state: State<'_, BunnyStorageState>,
    cancel_state: State<'_, CancellationState>,
    hosting_id: String,
    remote_path: String,
    local_path: String,
    transfer_id: String,
    options: Option<TransferOptions>,
) -> Result<(), String> {
    let session = get_session(&state, &hosting_id)?;
    let cancel_token = cancel_state.register(&transfer_id);
    let file_name = path_label(&remote_path);
    if should_skip_local(&session, &remote_path, &local_path, &options).await? {
        cancel_state.remove(&transfer_id);
        emit_finish(&app, &transfer_id, &file_name, 0, true);
        return Ok(());
    }
    let final_local_path = resolve_local_target(&local_path, &options)?;

    emit_progress(
        &app,
        &transfer_id,
        0,
        TransferStatus::Transferring,
        ProgressSnapshot::single_file(&file_name, 0, 0),
    );

    if is_cancelled(&cancel_token) {
        cancel_state.remove(&transfer_id);
        emit_cancelled(&app, &transfer_id, &file_name, 0);
        return Err("Transfer cancelled".to_string());
    }

    let progress_app = app.clone();
    let progress_transfer_id = transfer_id.clone();
    let progress_file_name = file_name.clone();
    let result = session
        .download_file_with_progress(
            &remote_path,
            &final_local_path,
            move |received, total| {
                emit_progress(
                    &progress_app,
                    &progress_transfer_id,
                    percentage(received, total),
                    TransferStatus::Transferring,
                    ProgressSnapshot::single_file(&progress_file_name, received, total),
                );
            },
            Some(cancel_token.clone()),
        )
        .await;
    let total_bytes = result.as_ref().copied().unwrap_or(0);
    let ok = result.is_ok();
    cancel_state.remove(&transfer_id);
    if is_cancelled(&cancel_token) {
        emit_cancelled(&app, &transfer_id, &file_name, total_bytes);
    } else {
        emit_finish(&app, &transfer_id, &file_name, total_bytes, ok);
    }
    result.map(|_| ())
}

#[tauri::command]
pub async fn bunny_storage_upload_dir(
    app: AppHandle,
    state: State<'_, BunnyStorageState>,
    cancel_state: State<'_, CancellationState>,
    hosting_id: String,
    local_dir: String,
    remote_dir: String,
    transfer_id: String,
    options: Option<TransferOptions>,
) -> Result<(), String> {
    let session = get_session(&state, &hosting_id)?;
    let cancel_token = cancel_state.register(&transfer_id);
    let mut remote_dir = remote_dir;
    if session.exists(&remote_dir).await? {
        match options.as_ref().map(|opts| opts.overwrite.as_str()) {
            Some("skip") => {
                cancel_state.remove(&transfer_id);
                emit_finish(&app, &transfer_id, &path_label(&local_dir), 0, true);
                return Ok(());
            }
            Some("rename") => remote_dir = unique_remote_path(&session, &remote_dir).await?,
            Some("ask") => {
                cancel_state.remove(&transfer_id);
                return Err(format!("Destination already exists: {}", remote_dir));
            }
            _ => {}
        }
    }
    let follow_symlinks = options
        .as_ref()
        .map(|opts| opts.follow_symlinks)
        .unwrap_or(true);
    let entries = collect_local_files(&local_dir, follow_symlinks)?;
    let dir_name = path_label(&local_dir);
    let total_files = entries.len() as u64;
    let total_bytes = entries
        .iter()
        .map(|entry| {
            std::fs::metadata(&entry.full_path)
                .map(|m| m.len())
                .unwrap_or(0)
        })
        .sum();
    let mut transferred_bytes = 0u64;
    let mut completed_files = 0u64;

    for entry in entries {
        if is_cancelled(&cancel_token) {
            cancel_state.remove(&transfer_id);
            emit_cancelled(&app, &transfer_id, &dir_name, total_bytes);
            return Err("Transfer cancelled".to_string());
        }

        let remote_file = join_remote_path(&remote_dir, &entry.rel_path);
        let file_total = std::fs::metadata(&entry.full_path)
            .map(|m| m.len())
            .unwrap_or(0);
        emit_progress(
            &app,
            &transfer_id,
            percentage(transferred_bytes, total_bytes),
            TransferStatus::Transferring,
            ProgressSnapshot::directory(
                &dir_name,
                transferred_bytes,
                total_bytes,
                Some((&entry.rel_path, 0, file_total)),
                completed_files,
                total_files,
            ),
        );

        if should_skip_remote(&session, &remote_file, &entry.full_path, &options).await? {
            transferred_bytes += file_total;
            completed_files += 1;
            continue;
        }

        let remote_file = resolve_remote_target(&session, &remote_file, &options).await?;

        let progress_app = app.clone();
        let progress_transfer_id = transfer_id.clone();
        let progress_dir_name = dir_name.clone();
        let current_file_name = entry.rel_path.clone();
        let base_transferred = transferred_bytes;
        let result = session
            .upload_file_with_progress(
                &entry.full_path,
                &remote_file,
                move |sent, total| {
                    emit_progress(
                        &progress_app,
                        &progress_transfer_id,
                        percentage(base_transferred + sent, total_bytes),
                        TransferStatus::Transferring,
                        ProgressSnapshot::directory(
                            &progress_dir_name,
                            base_transferred + sent,
                            total_bytes,
                            Some((&current_file_name, sent, total)),
                            completed_files,
                            total_files,
                        ),
                    );
                },
                Some(cancel_token.clone()),
            )
            .await;
        if let Err(error) = result {
            cancel_state.remove(&transfer_id);
            if is_cancelled(&cancel_token) {
                emit_cancelled(&app, &transfer_id, &dir_name, total_bytes);
            } else {
                emit_progress(
                    &app,
                    &transfer_id,
                    percentage(transferred_bytes, total_bytes),
                    TransferStatus::Error,
                    ProgressSnapshot::directory(
                        &dir_name,
                        transferred_bytes,
                        total_bytes,
                        Some((&entry.rel_path, 0, file_total)),
                        completed_files,
                        total_files,
                    ),
                );
            }
            return Err(error);
        }
        transferred_bytes += file_total;
        completed_files += 1;
    }

    cancel_state.remove(&transfer_id);
    emit_progress(
        &app,
        &transfer_id,
        100,
        TransferStatus::Done,
        ProgressSnapshot::directory(
            &dir_name,
            transferred_bytes,
            total_bytes,
            None,
            completed_files,
            total_files,
        ),
    );
    Ok(())
}

#[tauri::command]
pub async fn bunny_storage_download_dir(
    app: AppHandle,
    state: State<'_, BunnyStorageState>,
    cancel_state: State<'_, CancellationState>,
    hosting_id: String,
    remote_dir: String,
    local_dir: String,
    transfer_id: String,
    options: Option<TransferOptions>,
) -> Result<(), String> {
    let session = get_session(&state, &hosting_id)?;
    let cancel_token = cancel_state.register(&transfer_id);
    let mut local_dir = local_dir;
    if std::path::Path::new(&local_dir).exists() {
        match options.as_ref().map(|opts| opts.overwrite.as_str()) {
            Some("skip") => {
                cancel_state.remove(&transfer_id);
                emit_finish(&app, &transfer_id, &path_label(&remote_dir), 0, true);
                return Ok(());
            }
            Some("rename") => local_dir = unique_local_path(&local_dir),
            Some("ask") => {
                cancel_state.remove(&transfer_id);
                return Err(format!("Destination already exists: {}", local_dir));
            }
            _ => {}
        }
    }
    let dir_name = path_label(&remote_dir);
    let mut files = Vec::new();
    collect_remote_files(&session, &remote_dir, "", &mut files).await?;
    let total_files = files.len() as u64;
    let total_bytes = files.iter().map(|(_, item)| item.size).sum();
    let mut transferred_bytes = 0u64;
    let mut completed_files = 0u64;

    for (rel_path, item) in files {
        if is_cancelled(&cancel_token) {
            cancel_state.remove(&transfer_id);
            emit_cancelled(&app, &transfer_id, &dir_name, total_bytes);
            return Err("Transfer cancelled".to_string());
        }

        let remote_file = join_remote_path(&remote_dir, &rel_path);
        let local_file = std::path::Path::new(&local_dir)
            .join(&rel_path)
            .to_string_lossy()
            .to_string();
        emit_progress(
            &app,
            &transfer_id,
            percentage(transferred_bytes, total_bytes),
            TransferStatus::Transferring,
            ProgressSnapshot::directory(
                &dir_name,
                transferred_bytes,
                total_bytes,
                Some((&rel_path, 0, item.size)),
                completed_files,
                total_files,
            ),
        );

        if should_skip_local(&session, &remote_file, &local_file, &options).await? {
            transferred_bytes += item.size;
            completed_files += 1;
            continue;
        }

        let local_file = resolve_local_target(&local_file, &options)?;

        let progress_app = app.clone();
        let progress_transfer_id = transfer_id.clone();
        let progress_dir_name = dir_name.clone();
        let current_file_name = rel_path.clone();
        let base_transferred = transferred_bytes;
        let result = session
            .download_file_with_progress(
                &remote_file,
                &local_file,
                move |received, total| {
                    emit_progress(
                        &progress_app,
                        &progress_transfer_id,
                        percentage(base_transferred + received, total_bytes),
                        TransferStatus::Transferring,
                        ProgressSnapshot::directory(
                            &progress_dir_name,
                            base_transferred + received,
                            total_bytes,
                            Some((&current_file_name, received, total)),
                            completed_files,
                            total_files,
                        ),
                    );
                },
                Some(cancel_token.clone()),
            )
            .await;
        if let Err(error) = result {
            cancel_state.remove(&transfer_id);
            if is_cancelled(&cancel_token) {
                emit_cancelled(&app, &transfer_id, &dir_name, total_bytes);
            } else {
                emit_progress(
                    &app,
                    &transfer_id,
                    percentage(transferred_bytes, total_bytes),
                    TransferStatus::Error,
                    ProgressSnapshot::directory(
                        &dir_name,
                        transferred_bytes,
                        total_bytes,
                        Some((&rel_path, 0, item.size)),
                        completed_files,
                        total_files,
                    ),
                );
            }
            return Err(error);
        }
        transferred_bytes += item.size;
        completed_files += 1;
    }

    cancel_state.remove(&transfer_id);
    emit_progress(
        &app,
        &transfer_id,
        100,
        TransferStatus::Done,
        ProgressSnapshot::directory(
            &dir_name,
            transferred_bytes,
            total_bytes,
            None,
            completed_files,
            total_files,
        ),
    );
    Ok(())
}

#[tauri::command]
pub async fn bunny_storage_mkdir(
    state: State<'_, BunnyStorageState>,
    hosting_id: String,
    path: String,
) -> Result<(), String> {
    validate_remote_operation_path(&path)?;
    let session = get_session(&state, &hosting_id)?;
    if session.exists(&path).await? {
        return Err(format!("Folder already exists: {}", path));
    }
    session.mkdir(&path).await
}

#[tauri::command]
pub async fn bunny_storage_delete(
    app: AppHandle,
    state: State<'_, BunnyStorageState>,
    hosting_id: String,
    path: String,
    is_dir: bool,
    delete_id: Option<String>,
) -> Result<(), String> {
    validate_remote_delete_path(&path)?;
    let session = get_session(&state, &hosting_id)?;
    emit_delete_progress(&app, delete_id.as_deref(), &path);
    session.delete_path(&path, is_dir).await?;
    emit_delete_progress(&app, delete_id.as_deref(), &path);
    Ok(())
}

fn validate_remote_delete_path(path: &str) -> Result<(), String> {
    let trimmed = path.trim_matches('/');
    if trimmed.is_empty() {
        return Err("Refusing to delete the remote root directory.".to_string());
    }
    if trimmed
        .split('/')
        .any(|segment| segment.is_empty() || segment == "." || segment == "..")
    {
        return Err(format!("Invalid remote delete path: {}", path));
    }
    Ok(())
}

fn validate_remote_operation_path(path: &str) -> Result<(), String> {
    let trimmed = path.trim_matches('/');
    if trimmed.is_empty()
        || trimmed
            .split('/')
            .any(|segment| segment.is_empty() || segment == "." || segment == "..")
    {
        return Err(format!("Invalid remote path: {}", path));
    }
    Ok(())
}

fn emit_delete_progress(app: &AppHandle, delete_id: Option<&str>, path: &str) {
    let Some(delete_id) = delete_id else {
        return;
    };
    let item_name = path
        .split('/')
        .filter(|part| !part.is_empty())
        .last()
        .unwrap_or(path)
        .to_string();
    let _ = app.emit(
        "delete-progress",
        DeleteProgress {
            delete_id: delete_id.to_string(),
            path: path.to_string(),
            item_name,
        },
    );
}

#[tauri::command]
pub async fn bunny_storage_rename(
    _state: State<'_, BunnyStorageState>,
    _hosting_id: String,
    _from: String,
    _to: String,
) -> Result<(), String> {
    Err(
        "Bunny Storage API does not support atomic rename. Create a copy/upload plan instead."
            .to_string(),
    )
}

#[tauri::command]
pub fn bunny_storage_disconnect(
    state: State<'_, BunnyStorageState>,
    hosting_id: String,
) -> Result<(), String> {
    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    sessions.remove(&hosting_id);
    Ok(())
}

fn get_session(
    state: &State<'_, BunnyStorageState>,
    hosting_id: &str,
) -> Result<BunnyStorageSession, String> {
    let sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    sessions
        .get(hosting_id)
        .cloned()
        .ok_or_else(|| "Not connected".to_string())
}

async fn resolve_remote_target(
    session: &BunnyStorageSession,
    remote_path: &str,
    options: &Option<TransferOptions>,
) -> Result<String, String> {
    if options.as_ref().map(|opts| opts.overwrite.as_str()) == Some("rename")
        && session.exists(remote_path).await?
    {
        return unique_remote_path(session, remote_path).await;
    }

    Ok(remote_path.to_string())
}

async fn should_skip_remote(
    session: &BunnyStorageSession,
    remote_path: &str,
    local_path: &str,
    options: &Option<TransferOptions>,
) -> Result<bool, String> {
    if !session.exists(remote_path).await? {
        return Ok(false);
    }

    match options.as_ref().map(|opts| opts.overwrite.as_str()) {
        Some("skip") => Ok(true),
        Some("overwrite-older") => {
            let local_mtime = std::fs::metadata(local_path)
                .ok()
                .and_then(|metadata| metadata.modified().ok())
                .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|duration| duration.as_secs() as i64);
            Ok(matches!(
                (local_mtime, session.file_mtime(remote_path).await),
                (Some(local), Some(remote)) if remote >= local
            ))
        }
        _ => Ok(false),
    }
}

fn resolve_local_target(
    local_path: &str,
    options: &Option<TransferOptions>,
) -> Result<String, String> {
    if !std::path::Path::new(local_path).exists() {
        return Ok(local_path.to_string());
    }

    match options.as_ref().map(|opts| opts.overwrite.as_str()) {
        Some("skip") => Ok(local_path.to_string()),
        Some("rename") => Ok(unique_local_path(local_path)),
        _ => Ok(local_path.to_string()),
    }
}

async fn should_skip_local(
    session: &BunnyStorageSession,
    remote_path: &str,
    local_path: &str,
    options: &Option<TransferOptions>,
) -> Result<bool, String> {
    if !std::path::Path::new(local_path).exists() {
        return Ok(false);
    }
    match options.as_ref().map(|opts| opts.overwrite.as_str()) {
        Some("skip") => Ok(true),
        Some("overwrite-older") => {
            let local_mtime = std::fs::metadata(local_path)
                .ok()
                .and_then(|metadata| metadata.modified().ok())
                .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|duration| duration.as_secs() as i64);
            Ok(
                matches!((local_mtime, session.file_mtime(remote_path).await), (Some(local), Some(remote)) if local >= remote),
            )
        }
        _ => Ok(false),
    }
}

async fn unique_remote_path(session: &BunnyStorageSession, path: &str) -> Result<String, String> {
    for i in 1..1000 {
        let candidate = numbered_path(path, i);
        if !session.exists(&candidate).await? {
            return Ok(candidate);
        }
    }
    Err("Could not create unique Bunny Storage path".to_string())
}

fn unique_local_path(path: &str) -> String {
    for i in 1..1000 {
        let candidate = numbered_path(path, i);
        if !std::path::Path::new(&candidate).exists() {
            return candidate;
        }
    }
    numbered_path(path, 1000)
}

fn numbered_path(path: &str, index: usize) -> String {
    let p = std::path::Path::new(path);
    let stem = p
        .file_stem()
        .map(|s| s.to_string_lossy())
        .unwrap_or_default();
    let ext = p.extension().map(|s| s.to_string_lossy());
    let parent = p.parent().map(|p| p.to_string_lossy()).unwrap_or_default();
    let name = match ext {
        Some(ext) if !ext.is_empty() => format!("{}-{}.{}", stem, index, ext),
        _ => format!("{}-{}", stem, index),
    };
    if parent.is_empty() {
        name
    } else {
        format!("{}/{}", parent, name)
    }
}

fn collect_local_files(root: &str, follow_symlinks: bool) -> Result<Vec<LocalDirEntry>, String> {
    let mut entries = Vec::new();
    for entry in walkdir::WalkDir::new(root).follow_links(follow_symlinks) {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.file_type().is_symlink() && !follow_symlinks {
            return Err(format!(
                "Symlink transfer disabled: {}",
                entry.path().display()
            ));
        }
        if entry.file_type().is_dir() {
            continue;
        }
        let full_path = entry.path().to_string_lossy().to_string();
        let rel_path = entry
            .path()
            .strip_prefix(root)
            .map_err(|e| e.to_string())?
            .to_string_lossy()
            .trim_start_matches('/')
            .to_string();
        entries.push(LocalDirEntry {
            rel_path,
            full_path,
        });
    }
    Ok(entries)
}

async fn collect_remote_files(
    session: &BunnyStorageSession,
    remote_dir: &str,
    rel_prefix: &str,
    files: &mut Vec<(String, FileItem)>,
) -> Result<(), String> {
    let current = if rel_prefix.is_empty() {
        remote_dir.to_string()
    } else {
        join_remote_path(remote_dir, rel_prefix)
    };

    for item in session.list_dir(&current).await? {
        let rel_path = if rel_prefix.is_empty() {
            item.name.clone()
        } else {
            format!("{}/{}", rel_prefix.trim_end_matches('/'), item.name)
        };
        if item.is_directory {
            Box::pin(collect_remote_files(session, remote_dir, &rel_path, files)).await?;
        } else {
            files.push((rel_path, item));
        }
    }
    Ok(())
}

fn join_remote_path(base: &str, name: &str) -> String {
    format!(
        "{}/{}",
        base.trim_end_matches('/'),
        name.trim_start_matches('/')
    )
}

fn path_label(path: &str) -> String {
    std::path::Path::new(path)
        .file_name()
        .map(|name| name.to_string_lossy().to_string())
        .filter(|name| !name.is_empty())
        .unwrap_or_else(|| path.to_string())
}

fn percentage(done: u64, total: u64) -> u8 {
    if total == 0 {
        100
    } else {
        ((done as f64 / total as f64) * 100.0).clamp(0.0, 100.0) as u8
    }
}

#[cfg(test)]
mod tests {
    use super::validate_remote_delete_path;

    #[test]
    fn delete_path_rejects_root_and_traversal() {
        for path in ["", "/", "folder/../file", "folder/./file", "folder//file"] {
            assert!(
                validate_remote_delete_path(path).is_err(),
                "accepted {}",
                path
            );
        }
    }

    #[test]
    fn delete_path_accepts_normal_target() {
        assert!(validate_remote_delete_path("/folder/file.txt").is_ok());
    }
}

fn emit_cancelled(app: &AppHandle, transfer_id: &str, file_name: &str, total_bytes: u64) {
    emit_progress(
        app,
        transfer_id,
        0,
        TransferStatus::Cancelled,
        ProgressSnapshot::single_file(file_name, 0, total_bytes),
    );
}

fn emit_finish(app: &AppHandle, transfer_id: &str, file_name: &str, total_bytes: u64, ok: bool) {
    emit_progress(
        app,
        transfer_id,
        if ok { 100 } else { 0 },
        if ok {
            TransferStatus::Done
        } else {
            TransferStatus::Error
        },
        ProgressSnapshot::single_file(file_name, if ok { total_bytes } else { 0 }, total_bytes),
    );
}

fn emit_progress(
    app: &AppHandle,
    transfer_id: &str,
    progress: u8,
    status: TransferStatus,
    snapshot: ProgressSnapshot,
) {
    let payload = TransferProgress {
        transfer_id: transfer_id.to_string(),
        file_name: snapshot.file_name,
        progress,
        status,
        bytes_transferred: snapshot.bytes_transferred,
        total_bytes: snapshot.total_bytes,
        current_file_name: snapshot.current_file_name,
        current_file_bytes_transferred: snapshot.current_file_bytes_transferred,
        current_file_total_bytes: snapshot.current_file_total_bytes,
        completed_files: snapshot.completed_files,
        total_files: snapshot.total_files,
    };
    app.state::<TransferRegistry>().record(payload.clone());
    let _ = app.emit("transfer-progress", payload);
}

impl ProgressSnapshot {
    fn single_file(file_name: &str, bytes_transferred: u64, total_bytes: u64) -> Self {
        Self {
            file_name: file_name.to_string(),
            bytes_transferred,
            total_bytes,
            current_file_name: Some(file_name.to_string()),
            current_file_bytes_transferred: Some(bytes_transferred),
            current_file_total_bytes: Some(total_bytes),
            completed_files: Some(if bytes_transferred >= total_bytes {
                1
            } else {
                0
            }),
            total_files: Some(1),
        }
    }

    fn directory(
        file_name: &str,
        bytes_transferred: u64,
        total_bytes: u64,
        current: Option<(&str, u64, u64)>,
        completed_files: u64,
        total_files: u64,
    ) -> Self {
        Self {
            file_name: file_name.to_string(),
            bytes_transferred,
            total_bytes,
            current_file_name: current.map(|(name, _, _)| name.to_string()),
            current_file_bytes_transferred: current.map(|(_, done, _)| done),
            current_file_total_bytes: current.map(|(_, _, total)| total),
            completed_files: Some(completed_files),
            total_files: Some(total_files),
        }
    }
}
