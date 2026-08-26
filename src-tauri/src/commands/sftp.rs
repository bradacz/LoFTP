use crate::models::file_item::FileItem;
use crate::models::transfer::{
    TransferOptions, TransferProgress, TransferRegistry, TransferStatus,
};
use crate::services::{credential_store, sftp_client::SftpSession};
use serde::Serialize;
use std::collections::HashMap;
use std::collections::HashSet;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};

pub struct SftpState {
    pub sessions: Mutex<HashMap<String, SftpSession>>,
}

#[derive(Debug)]
struct LocalDirEntry {
    rel_path: String,
    full_path: String,
    is_dir: bool,
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

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DeleteProgress {
    delete_id: String,
    path: String,
    item_name: String,
}

impl SftpState {
    pub fn new() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
        }
    }
}

#[tauri::command]
pub fn sftp_connect(
    state: State<'_, SftpState>,
    hosting_id: String,
    host: String,
    port: u16,
    username: String,
    password: String,
    ssh_key_path: Option<String>,
) -> Result<(), String> {
    let resolved_password = resolve_password(&hosting_id, password, ssh_key_path.as_deref())?;
    let session = SftpSession::connect(
        &host,
        port,
        &username,
        &resolved_password,
        ssh_key_path.as_deref(),
    )?;
    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    sessions.insert(hosting_id, session);
    Ok(())
}

#[tauri::command]
pub fn sftp_test_connection(
    host: String,
    port: u16,
    username: String,
    password: String,
    ssh_key_path: Option<String>,
) -> Result<(), String> {
    let mut session =
        SftpSession::connect(&host, port, &username, &password, ssh_key_path.as_deref())?;
    session.list_dir("/")?;
    session.disconnect().ok();
    Ok(())
}

fn resolve_password(
    hosting_id: &str,
    password: String,
    ssh_key_path: Option<&str>,
) -> Result<String, String> {
    if !password.is_empty() {
        return Ok(password);
    }

    if let Some(stored_password) = credential_store::load_hosting_password(hosting_id) {
        return Ok(stored_password);
    }

    if ssh_key_path.is_some() {
        return Ok(String::new());
    }

    Err("Password is not configured.".to_string())
}

#[tauri::command]
pub fn sftp_list(
    state: State<'_, SftpState>,
    hosting_id: String,
    path: String,
) -> Result<Vec<FileItem>, String> {
    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    let session = sessions.get_mut(&hosting_id).ok_or("Not connected")?;
    session.list_dir(&path)
}

#[tauri::command]
pub fn sftp_upload(
    app: AppHandle,
    state: State<'_, SftpState>,
    hosting_id: String,
    local_path: String,
    remote_path: String,
    transfer_id: String,
    options: Option<TransferOptions>,
) -> Result<(), String> {
    let file_name = std::path::Path::new(&local_path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    let total_bytes = std::fs::metadata(&local_path).map(|m| m.len()).unwrap_or(0);

    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    let session = sessions.get_mut(&hosting_id).ok_or("Not connected")?;

    if let Some(ref opts) = options {
        if session.exists(&remote_path)? {
            match opts.overwrite.as_str() {
                "skip" => {
                    emit_progress(
                        &app,
                        &transfer_id,
                        100,
                        TransferStatus::Done,
                        ProgressSnapshot::single_file(&file_name, total_bytes, total_bytes),
                    );
                    return Ok(());
                }
                "rename" => {
                    let new_path = generate_unique_name(&remote_path);
                    return do_sftp_upload(
                        session,
                        &app,
                        &local_path,
                        &new_path,
                        &transfer_id,
                        &file_name,
                        total_bytes,
                    );
                }
                "overwrite-older" => {
                    let local_mtime = std::fs::metadata(&local_path)
                        .ok()
                        .and_then(|m| m.modified().ok())
                        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                        .map(|d| d.as_secs() as i64);
                    let remote_mtime = session.file_mtime(&remote_path);
                    if let (Some(local_t), Some(remote_t)) = (local_mtime, remote_mtime) {
                        if remote_t >= local_t {
                            emit_progress(
                                &app,
                                &transfer_id,
                                100,
                                TransferStatus::Done,
                                ProgressSnapshot::single_file(&file_name, total_bytes, total_bytes),
                            );
                            return Ok(());
                        }
                    }
                }
                "ask" => return Err(format!("Destination already exists: {}", remote_path)),
                _ => {}
            }
        }
        if opts.create_dirs {
            if let Some(parent) = std::path::Path::new(&remote_path).parent() {
                let ps = parent.to_string_lossy().to_string();
                if ps != "/" && !ps.is_empty() {
                    let _ = session.mkdir_p(&ps);
                }
            }
        }
    }

    do_sftp_upload(
        session,
        &app,
        &local_path,
        &remote_path,
        &transfer_id,
        &file_name,
        total_bytes,
    )
}

fn do_sftp_upload(
    session: &mut SftpSession,
    app: &AppHandle,
    local_path: &str,
    remote_path: &str,
    transfer_id: &str,
    file_name: &str,
    total_bytes: u64,
) -> Result<(), String> {
    let app_c = app.clone();
    let tid = transfer_id.to_string();
    let fname = file_name.to_string();
    let mut last_pct: u8 = 0;

    let result = session.upload_with_progress(local_path, remote_path, |sent, total| {
        let pct = if total > 0 {
            ((sent as f64 / total as f64) * 100.0) as u8
        } else {
            0
        };
        if pct >= last_pct + 2 || pct == 100 || sent == 0 {
            last_pct = pct;
            emit_progress(
                &app_c,
                &tid,
                pct,
                TransferStatus::Transferring,
                ProgressSnapshot::single_file(&fname, sent, total),
            );
        }
    });

    let status = if result.is_ok() {
        TransferStatus::Done
    } else {
        TransferStatus::Error
    };
    emit_progress(
        app,
        transfer_id,
        if result.is_ok() { 100 } else { 0 },
        status,
        ProgressSnapshot::single_file(
            file_name,
            if result.is_ok() { total_bytes } else { 0 },
            total_bytes,
        ),
    );
    result
}

#[tauri::command]
pub fn sftp_download(
    app: AppHandle,
    state: State<'_, SftpState>,
    hosting_id: String,
    remote_path: String,
    local_path: String,
    transfer_id: String,
    options: Option<TransferOptions>,
) -> Result<(), String> {
    let file_name = std::path::Path::new(&remote_path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    let session = sessions.get_mut(&hosting_id).ok_or("Not connected")?;

    if let Some(ref opts) = options {
        if std::path::Path::new(&local_path).exists() {
            match opts.overwrite.as_str() {
                "skip" => {
                    emit_progress(
                        &app,
                        &transfer_id,
                        100,
                        TransferStatus::Done,
                        ProgressSnapshot::single_file(&file_name, 0, 0),
                    );
                    return Ok(());
                }
                "rename" => {
                    let new_path = generate_unique_name(&local_path);
                    return do_sftp_download(
                        session,
                        &app,
                        &remote_path,
                        &new_path,
                        &transfer_id,
                        &file_name,
                    );
                }
                "overwrite-older" => {
                    let local_mtime = std::fs::metadata(&local_path)
                        .ok()
                        .and_then(|m| m.modified().ok())
                        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                        .map(|d| d.as_secs() as i64);
                    let remote_mtime = session.file_mtime(&remote_path);
                    if let (Some(local_t), Some(remote_t)) = (local_mtime, remote_mtime) {
                        if local_t >= remote_t {
                            emit_progress(
                                &app,
                                &transfer_id,
                                100,
                                TransferStatus::Done,
                                ProgressSnapshot::single_file(&file_name, 0, 0),
                            );
                            return Ok(());
                        }
                    }
                }
                "ask" => return Err(format!("Destination already exists: {}", local_path)),
                _ => {}
            }
        }
        if opts.create_dirs {
            if let Some(parent) = std::path::Path::new(&local_path).parent() {
                let _ = std::fs::create_dir_all(parent);
            }
        }
    }

    do_sftp_download(
        session,
        &app,
        &remote_path,
        &local_path,
        &transfer_id,
        &file_name,
    )
}

fn do_sftp_download(
    session: &mut SftpSession,
    app: &AppHandle,
    remote_path: &str,
    local_path: &str,
    transfer_id: &str,
    file_name: &str,
) -> Result<(), String> {
    let app_c = app.clone();
    let tid = transfer_id.to_string();
    let fname = file_name.to_string();

    emit_progress(
        app,
        transfer_id,
        0,
        TransferStatus::Transferring,
        ProgressSnapshot::single_file(file_name, 0, 0),
    );

    let result = session.download_with_progress(remote_path, local_path, |received, total| {
        let pct = if total > 0 {
            ((received as f64 / total as f64) * 100.0) as u8
        } else {
            0
        };
        emit_progress(
            &app_c,
            &tid,
            pct,
            TransferStatus::Transferring,
            ProgressSnapshot::single_file(&fname, received, total),
        );
    });

    let total_bytes = std::fs::metadata(local_path).map(|m| m.len()).unwrap_or(0);
    let status = if result.is_ok() {
        TransferStatus::Done
    } else {
        TransferStatus::Error
    };
    emit_progress(
        app,
        transfer_id,
        if result.is_ok() { 100 } else { 0 },
        status,
        ProgressSnapshot::single_file(
            file_name,
            if result.is_ok() { total_bytes } else { 0 },
            total_bytes,
        ),
    );
    result
}

/// Upload entire directory recursively
#[tauri::command]
pub fn sftp_upload_dir(
    app: AppHandle,
    state: State<'_, SftpState>,
    hosting_id: String,
    local_dir: String,
    remote_dir: String,
    transfer_id: String,
    options: Option<TransferOptions>,
) -> Result<(), String> {
    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    let session = sessions.get_mut(&hosting_id).ok_or("Not connected")?;

    let mut remote_dir = remote_dir;
    if let Some(ref opts) = options {
        if session.exists(&remote_dir)? {
            match opts.overwrite.as_str() {
                "skip" => {
                    emit_progress(
                        &app,
                        &transfer_id,
                        100,
                        TransferStatus::Done,
                        ProgressSnapshot::directory(
                            &std::path::Path::new(&local_dir)
                                .file_name()
                                .map(|name| name.to_string_lossy().to_string())
                                .unwrap_or_default(),
                            0,
                            0,
                            None,
                            0,
                            0,
                        ),
                    );
                    return Ok(());
                }
                "rename" => remote_dir = generate_unique_remote_name(session, &remote_dir)?,
                "ask" => return Err(format!("Destination already exists: {}", remote_dir)),
                _ => {}
            }
        }
    }
    let _ = session.mkdir_p(&remote_dir);
    let follow_symlinks = options
        .as_ref()
        .map(|opts| opts.follow_symlinks)
        .unwrap_or(true);
    let entries = collect_local_entries(&local_dir, follow_symlinks)?;
    let dir_entries: Vec<&LocalDirEntry> = entries.iter().filter(|entry| entry.is_dir).collect();
    let file_entries: Vec<&LocalDirEntry> = entries.iter().filter(|entry| !entry.is_dir).collect();
    let total_files = file_entries.len();
    let total_bytes: u64 = file_entries
        .iter()
        .map(|entry| {
            std::fs::metadata(&entry.full_path)
                .map(|m| m.len())
                .unwrap_or(0)
        })
        .sum();
    let dir_name = std::path::Path::new(&local_dir)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    for entry in dir_entries {
        let remote_path = join_remote_path(&remote_dir, &entry.rel_path);
        let _ = session.mkdir_p(&remote_path);
    }

    if total_files == 0 {
        emit_progress(
            &app,
            &transfer_id,
            100,
            TransferStatus::Done,
            ProgressSnapshot::directory(&dir_name, 0, 0, None, 0, 0),
        );
        return Ok(());
    }

    let mut completed_files = 0u64;
    let mut transferred_bytes = 0u64;

    for entry in &file_entries {
        let mut remote_file = join_remote_path(&remote_dir, &entry.rel_path);

        if let Some(parent) = std::path::Path::new(&remote_file).parent() {
            let ps = parent.to_string_lossy().to_string();
            let _ = session.mkdir_p(&ps);
        }

        if let Some(ref opts) = options {
            if session.exists(&remote_file)? {
                match opts.overwrite.as_str() {
                    "skip" => {
                        completed_files += 1;
                        transferred_bytes += std::fs::metadata(&entry.full_path)
                            .map(|m| m.len())
                            .unwrap_or(0);
                        continue;
                    }
                    "rename" => remote_file = generate_unique_remote_name(session, &remote_file)?,
                    "overwrite-older" => {
                        let local_mtime = std::fs::metadata(&entry.full_path)
                            .ok()
                            .and_then(|m| m.modified().ok())
                            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                            .map(|d| d.as_secs() as i64);
                        if let (Some(local), Some(remote)) =
                            (local_mtime, session.file_mtime(&remote_file))
                        {
                            if remote >= local {
                                completed_files += 1;
                                transferred_bytes += std::fs::metadata(&entry.full_path)
                                    .map(|m| m.len())
                                    .unwrap_or(0);
                                continue;
                            }
                        }
                    }
                    "ask" => return Err(format!("Destination already exists: {}", remote_file)),
                    _ => {}
                }
            }
        }

        let current_file_total = std::fs::metadata(&entry.full_path)
            .map(|m| m.len())
            .unwrap_or(0);
        let total_files_u64 = total_files as u64;
        let current_file_name = entry.rel_path.clone();
        let progress_before = percentage(transferred_bytes, total_bytes);

        emit_progress(
            &app,
            &transfer_id,
            progress_before,
            TransferStatus::Transferring,
            ProgressSnapshot::directory(
                &dir_name,
                transferred_bytes,
                total_bytes,
                Some((&current_file_name, 0, current_file_total)),
                completed_files,
                total_files_u64,
            ),
        );

        let app_c = app.clone();
        let tid = transfer_id.clone();
        let file_name = current_file_name.clone();

        let result = session.upload_with_progress(&entry.full_path, &remote_file, |sent, total| {
            let overall_bytes = transferred_bytes + sent;
            emit_progress(
                &app_c,
                &tid,
                percentage(overall_bytes, total_bytes),
                TransferStatus::Transferring,
                ProgressSnapshot::directory(
                    &dir_name,
                    overall_bytes,
                    total_bytes,
                    Some((&file_name, sent, total)),
                    completed_files,
                    total_files_u64,
                ),
            );
        });

        if let Err(e) = result {
            emit_progress(
                &app,
                &transfer_id,
                percentage(transferred_bytes, total_bytes),
                TransferStatus::Error,
                ProgressSnapshot::directory(
                    &dir_name,
                    transferred_bytes,
                    total_bytes,
                    Some((&current_file_name, 0, current_file_total)),
                    completed_files,
                    total_files_u64,
                ),
            );
            return Err(e);
        }

        transferred_bytes += current_file_total;
        completed_files += 1;
    }

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
            total_files as u64,
        ),
    );
    Ok(())
}

/// Download entire directory recursively
#[tauri::command]
pub fn sftp_download_dir(
    app: AppHandle,
    state: State<'_, SftpState>,
    hosting_id: String,
    remote_dir: String,
    local_dir: String,
    transfer_id: String,
    options: Option<TransferOptions>,
) -> Result<(), String> {
    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    let session = sessions.get_mut(&hosting_id).ok_or("Not connected")?;

    let mut local_dir = local_dir;
    if std::path::Path::new(&local_dir).exists() {
        if let Some(ref opts) = options {
            match opts.overwrite.as_str() {
                "skip" => {
                    emit_progress(
                        &app,
                        &transfer_id,
                        100,
                        TransferStatus::Done,
                        ProgressSnapshot::directory(
                            &directory_label(&remote_dir),
                            0,
                            0,
                            None,
                            0,
                            0,
                        ),
                    );
                    return Ok(());
                }
                "rename" => local_dir = unique_local_path(&local_dir),
                "ask" => return Err(format!("Destination already exists: {}", local_dir)),
                _ => {}
            }
        }
    }
    std::fs::create_dir_all(&local_dir).map_err(|e| format!("Create local dir failed: {}", e))?;
    let dir_name = directory_label(&remote_dir);
    let stats = collect_remote_dir_stats(session, &remote_dir)?;

    emit_progress(
        &app,
        &transfer_id,
        0,
        TransferStatus::Transferring,
        ProgressSnapshot::directory(&dir_name, 0, stats.total_bytes, None, 0, stats.total_files),
    );
    let final_state = download_dir_recursive(
        session,
        &app,
        &transfer_id,
        &remote_dir,
        &local_dir,
        &options,
        &dir_name,
        &stats,
        ProgressAccumulator::default(),
    )?;
    emit_progress(
        &app,
        &transfer_id,
        100,
        TransferStatus::Done,
        ProgressSnapshot::directory(
            &dir_name,
            final_state.bytes,
            stats.total_bytes,
            None,
            final_state.files,
            stats.total_files,
        ),
    );
    Ok(())
}

fn download_dir_recursive(
    session: &mut SftpSession,
    app: &AppHandle,
    transfer_id: &str,
    remote_dir: &str,
    local_dir: &str,
    options: &Option<TransferOptions>,
    dir_name: &str,
    stats: &RemoteDirStats,
    mut progress: ProgressAccumulator,
) -> Result<ProgressAccumulator, String> {
    let items = session.list_dir(remote_dir)?;
    for item in items {
        if item.name == ".." {
            continue;
        }
        let remote_path = join_remote_path(&remote_dir, &item.name);
        let mut local_path = std::path::Path::new(&local_dir)
            .join(&item.name)
            .to_string_lossy()
            .to_string();

        if item.is_directory {
            if let Some(ref opts) = options {
                if std::path::Path::new(&local_path).exists() {
                    match opts.overwrite.as_str() {
                        "skip" => continue,
                        "rename" => local_path = unique_local_path(&local_path),
                        "ask" => return Err(format!("Destination already exists: {}", local_path)),
                        _ => {}
                    }
                }
            }
            std::fs::create_dir_all(&local_path)
                .map_err(|e| format!("Create dir failed: {}", e))?;
            progress = download_dir_recursive(
                session,
                app,
                transfer_id,
                &remote_path,
                &local_path,
                options,
                dir_name,
                stats,
                progress,
            )?;
        } else {
            if let Some(ref opts) = options {
                if std::path::Path::new(&local_path).exists() {
                    match opts.overwrite.as_str() {
                        "skip" => {
                            progress.files += 1;
                            progress.bytes += item.size;
                            continue;
                        }
                        "rename" => local_path = unique_local_path(&local_path),
                        "overwrite-older" => {
                            let local_mtime = std::fs::metadata(&local_path)
                                .ok()
                                .and_then(|m| m.modified().ok())
                                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                                .map(|d| d.as_secs() as i64);
                            if let (Some(local), Some(remote)) =
                                (local_mtime, session.file_mtime(&remote_path))
                            {
                                if local >= remote {
                                    progress.files += 1;
                                    progress.bytes += item.size;
                                    continue;
                                }
                            }
                        }
                        "ask" => return Err(format!("Destination already exists: {}", local_path)),
                        _ => {}
                    }
                }
            }
            let current_file_name = relative_child_path(remote_dir, &remote_path);
            let app_c = app.clone();
            let tid = transfer_id.to_string();
            let total_bytes = stats.total_bytes;
            let total_files = stats.total_files;
            let bytes_before = progress.bytes;
            let files_done = progress.files;
            session.download_with_progress(&remote_path, &local_path, |received, total| {
                let overall_bytes = bytes_before + received;
                emit_progress(
                    &app_c,
                    &tid,
                    percentage(overall_bytes, total_bytes),
                    TransferStatus::Transferring,
                    ProgressSnapshot::directory(
                        dir_name,
                        overall_bytes,
                        total_bytes,
                        Some((&current_file_name, received, total)),
                        files_done,
                        total_files,
                    ),
                );
            })?;
            progress.files += 1;
            progress.bytes += item.size;
        }
    }
    Ok(progress)
}

#[tauri::command]
pub fn sftp_mkdir(
    state: State<'_, SftpState>,
    hosting_id: String,
    path: String,
) -> Result<(), String> {
    validate_remote_operation_path(&path)?;
    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    let session = sessions.get_mut(&hosting_id).ok_or("Not connected")?;
    if session.exists(&path)? {
        return Err(format!("Folder already exists: {}", path));
    }
    session.mkdir(&path)
}

#[tauri::command]
pub fn sftp_delete(
    app: AppHandle,
    state: State<'_, SftpState>,
    hosting_id: String,
    path: String,
    is_dir: bool,
    delete_id: Option<String>,
) -> Result<(), String> {
    validate_remote_delete_path(&path)?;
    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    let session = sessions.get_mut(&hosting_id).ok_or("Not connected")?;
    if is_dir {
        delete_sftp_dir_recursive(session, &app, delete_id.as_deref(), &path)
    } else {
        emit_delete_progress(&app, delete_id.as_deref(), &path);
        session.delete_file(&path)
    }
}

fn delete_sftp_dir_recursive(
    session: &mut SftpSession,
    app: &AppHandle,
    delete_id: Option<&str>,
    path: &str,
) -> Result<(), String> {
    emit_delete_progress(app, delete_id, path);
    let items = session.list_dir(path)?;
    for item in items {
        if item.name == "." || item.name == ".." {
            continue;
        }
        let child = join_remote_path(path, &item.name);
        if item.is_directory {
            delete_sftp_dir_recursive(session, app, delete_id, &child)?;
        } else {
            emit_delete_progress(app, delete_id, &child);
            session.delete_file(&child)?;
        }
    }
    emit_delete_progress(app, delete_id, path);
    session.delete_dir(path)
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

fn join_remote_path(base: &str, name: &str) -> String {
    let clean_name = name.trim_start_matches('/');
    if base.is_empty() || base == "/" {
        format!("/{}", clean_name)
    } else {
        format!("{}/{}", base.trim_end_matches('/'), clean_name)
    }
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
pub fn sftp_rename(
    state: State<'_, SftpState>,
    hosting_id: String,
    from: String,
    to: String,
) -> Result<(), String> {
    validate_remote_operation_path(&from)?;
    validate_remote_operation_path(&to)?;
    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    let session = sessions.get_mut(&hosting_id).ok_or("Not connected")?;
    if session.exists(&to)? {
        return Err(format!("Rename target already exists: {}", to));
    }
    session.rename(&from, &to)
}

#[tauri::command]
pub fn sftp_disconnect(state: State<'_, SftpState>, hosting_id: String) -> Result<(), String> {
    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    if let Some(mut session) = sessions.remove(&hosting_id) {
        session.disconnect().ok();
    }
    Ok(())
}

// --- Helpers ---

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
    app.emit("transfer-progress", payload).ok();
}

fn generate_unique_name(path: &str) -> String {
    let p = std::path::Path::new(path);
    let stem = p
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();
    let ext = p
        .extension()
        .map(|s| format!(".{}", s.to_string_lossy()))
        .unwrap_or_default();
    let parent = p
        .parent()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();
    format!("{}/{}_copy{}", parent, stem, ext)
}

fn generate_unique_remote_name(session: &mut SftpSession, path: &str) -> Result<String, String> {
    for index in 1..1000 {
        let candidate = numbered_path(path, index);
        if !session.exists(&candidate)? {
            return Ok(candidate);
        }
    }
    Err(format!("Could not create unique destination for {}", path))
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

fn unique_local_path(path: &str) -> String {
    for index in 1..1000 {
        let candidate = numbered_path(path, index);
        if !std::path::Path::new(&candidate).exists() {
            return candidate;
        }
    }
    numbered_path(path, 1000)
}

fn collect_local_entries(dir: &str, follow_symlinks: bool) -> Result<Vec<LocalDirEntry>, String> {
    let mut result = Vec::new();
    let mut visited = HashSet::new();
    collect_entries_inner(dir, dir, &mut result, follow_symlinks, &mut visited)?;
    Ok(result)
}

fn collect_entries_inner(
    base: &str,
    current: &str,
    result: &mut Vec<LocalDirEntry>,
    follow_symlinks: bool,
    visited: &mut HashSet<std::path::PathBuf>,
) -> Result<(), String> {
    let identity =
        std::fs::canonicalize(current).unwrap_or_else(|_| std::path::PathBuf::from(current));
    if !visited.insert(identity.clone()) {
        return Err(format!("Symlink cycle detected while reading: {}", current));
    }
    let entries = std::fs::read_dir(current).map_err(|e| format!("Read dir failed: {}", e))?;
    for entry in entries.flatten() {
        let path = entry.path();
        let full = path.to_string_lossy().to_string();
        let metadata = std::fs::symlink_metadata(&path)
            .map_err(|e| format!("Read local entry failed: {}", e))?;
        if metadata.file_type().is_symlink() && !follow_symlinks {
            return Err(format!("Symlink transfer disabled: {}", full));
        }
        if path.is_dir() {
            let rel = full
                .strip_prefix(base)
                .unwrap_or(&full)
                .trim_start_matches('/')
                .to_string();
            result.push(LocalDirEntry {
                rel_path: rel,
                full_path: full.clone(),
                is_dir: true,
            });
            collect_entries_inner(base, &full, result, follow_symlinks, visited)?;
        } else {
            let rel = full
                .strip_prefix(base)
                .unwrap_or(&full)
                .trim_start_matches('/')
                .to_string();
            result.push(LocalDirEntry {
                rel_path: rel,
                full_path: full,
                is_dir: false,
            });
        }
    }
    visited.remove(&identity);
    Ok(())
}

#[derive(Default, Clone, Copy)]
struct ProgressAccumulator {
    files: u64,
    bytes: u64,
}

#[derive(Clone, Copy)]
struct RemoteDirStats {
    total_files: u64,
    total_bytes: u64,
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
            completed_files: Some(if total_bytes > 0 && bytes_transferred >= total_bytes {
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
        current_file: Option<(&str, u64, u64)>,
        completed_files: u64,
        total_files: u64,
    ) -> Self {
        let (current_file_name, current_file_bytes_transferred, current_file_total_bytes) =
            match current_file {
                Some((name, sent, total)) => (Some(name.to_string()), Some(sent), Some(total)),
                None => (None, None, None),
            };

        Self {
            file_name: file_name.to_string(),
            bytes_transferred,
            total_bytes,
            current_file_name,
            current_file_bytes_transferred,
            current_file_total_bytes,
            completed_files: Some(completed_files),
            total_files: Some(total_files),
        }
    }
}

fn percentage(done: u64, total: u64) -> u8 {
    if total == 0 {
        return 0;
    }

    ((done as f64 / total as f64) * 100.0)
        .round()
        .clamp(0.0, 100.0) as u8
}

fn collect_remote_dir_stats(
    session: &mut SftpSession,
    remote_dir: &str,
) -> Result<RemoteDirStats, String> {
    let mut stats = RemoteDirStats {
        total_files: 0,
        total_bytes: 0,
    };
    let items = session.list_dir(remote_dir)?;
    for item in items {
        if item.name == ".." {
            continue;
        }

        let remote_path = join_remote_path(&remote_dir, &item.name);
        if item.is_directory {
            let child_stats = collect_remote_dir_stats(session, &remote_path)?;
            stats.total_files += child_stats.total_files;
            stats.total_bytes += child_stats.total_bytes;
        } else {
            stats.total_files += 1;
            stats.total_bytes += item.size;
        }
    }
    Ok(stats)
}

fn directory_label(path: &str) -> String {
    std::path::Path::new(path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .filter(|name| !name.is_empty())
        .unwrap_or_else(|| "/".to_string())
}

fn relative_child_path(root: &str, child: &str) -> String {
    child
        .strip_prefix(root.trim_end_matches('/'))
        .unwrap_or(child)
        .trim_start_matches('/')
        .to_string()
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
