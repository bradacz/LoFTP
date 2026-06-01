use crate::commands::bunny_storage::BunnyStorageState;
use crate::commands::ftp::FtpState;
use crate::commands::sftp::SftpState;
use crate::models::file_item::FileItem;
use crate::models::hosting::Protocol;
use crate::services::config_store;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    fs,
    io::Write,
    net::SocketAddr,
    path::{Path, PathBuf},
    sync::Mutex,
};
use tauri::{AppHandle, Manager, State};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::{TcpListener, TcpStream},
    sync::oneshot,
};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexBridgeSettings {
    pub enabled: bool,
    pub port: u16,
    #[serde(default)]
    pub running: bool,
    #[serde(default)]
    pub session_token: Option<String>,
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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub storage_zone_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pull_zone_url: Option<String>,
}

pub struct CodexBridgeState {
    runtime: Mutex<Option<CodexBridgeRuntime>>,
}

struct CodexBridgeRuntime {
    port: u16,
    session_token: String,
    shutdown: Option<oneshot::Sender<()>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CodexPlan {
    id: String,
    kind: String,
    hosting_id: Option<String>,
    local_base_path: Option<String>,
    remote_base_path: Option<String>,
    actions: Vec<CodexPlanAction>,
    risks: Vec<String>,
    requires_confirmation: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CodexPlanAction {
    action_type: String,
    local_path: Option<String>,
    remote_path: Option<String>,
    size: Option<u64>,
    destructive: bool,
}

impl CodexBridgeState {
    pub fn new() -> Self {
        Self {
            runtime: Mutex::new(None),
        }
    }

    fn snapshot(&self) -> (bool, Option<u16>, Option<String>) {
        match self.runtime.lock() {
            Ok(runtime) => runtime
                .as_ref()
                .map(|runtime| {
                    (
                        true,
                        Some(runtime.port),
                        Some(runtime.session_token.clone()),
                    )
                })
                .unwrap_or((false, None, None)),
            Err(_) => (false, None, None),
        }
    }

    fn start(&self, app: AppHandle, port: u16) -> Result<String, String> {
        self.stop();

        let std_listener = std::net::TcpListener::bind(("127.0.0.1", port))
            .map_err(|e| format!("Codex bridge bind failed: {}", e))?;
        std_listener
            .set_nonblocking(true)
            .map_err(|e| format!("Codex bridge nonblocking setup failed: {}", e))?;
        let listener = TcpListener::from_std(std_listener)
            .map_err(|e| format!("Codex bridge listener failed: {}", e))?;
        let token = Uuid::new_v4().to_string();
        let task_token = token.clone();
        let (tx, rx) = oneshot::channel();

        tauri::async_runtime::spawn(async move {
            run_bridge_server(app, listener, task_token, rx).await;
        });

        let mut runtime = self.runtime.lock().map_err(|e| e.to_string())?;
        *runtime = Some(CodexBridgeRuntime {
            port,
            session_token: token.clone(),
            shutdown: Some(tx),
        });
        Ok(token)
    }

    fn stop(&self) {
        if let Ok(mut runtime) = self.runtime.lock() {
            if let Some(mut runtime) = runtime.take() {
                if let Some(shutdown) = runtime.shutdown.take() {
                    let _ = shutdown.send(());
                }
            }
        }
    }
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
pub fn codex_get_bridge_settings(state: State<'_, CodexBridgeState>) -> CodexBridgeSettings {
    let mut settings = fs::read_to_string(settings_path())
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or(CodexBridgeSettings {
            enabled: false,
            port: 17642,
            running: false,
            session_token: None,
        });
    let (running, port, token) = state.snapshot();
    settings.running = running;
    if let Some(port) = port {
        settings.port = port;
    }
    settings.session_token = token;
    settings
}

#[tauri::command]
pub fn codex_save_bridge_settings(
    app: AppHandle,
    state: State<'_, CodexBridgeState>,
    settings: CodexBridgeSettings,
) -> Result<CodexBridgeSettings, String> {
    let port = if settings.port == 0 {
        17642
    } else {
        settings.port
    };
    let mut sanitized = CodexBridgeSettings {
        enabled: settings.enabled,
        port,
        running: false,
        session_token: None,
    };
    let raw = serde_json::to_string_pretty(&sanitized).map_err(|e| e.to_string())?;
    fs::write(settings_path(), raw).map_err(|e| e.to_string())?;

    if sanitized.enabled {
        let token = state.start(app, port)?;
        sanitized.running = true;
        sanitized.session_token = Some(token);
    } else {
        state.stop();
    }

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
                Protocol::Ftp => "ftp".to_string(),
                Protocol::Ftps => "ftps".to_string(),
                Protocol::Sftp => "sftp".to_string(),
                Protocol::BunnyStorage => "bunnyStorage".to_string(),
            },
            username: hosting.username,
            storage_zone_name: hosting.storage_zone_name,
            pull_zone_url: hosting.pull_zone_url,
        })
        .collect()
}

pub fn codex_start_bridge_from_saved_settings(app: AppHandle) {
    let settings = fs::read_to_string(settings_path())
        .ok()
        .and_then(|raw| serde_json::from_str::<CodexBridgeSettings>(&raw).ok())
        .unwrap_or(CodexBridgeSettings {
            enabled: false,
            port: 17642,
            running: false,
            session_token: None,
        });

    if settings.enabled {
        let state = app.state::<CodexBridgeState>();
        let port = if settings.port == 0 { 17642 } else { settings.port };
        let _ = state.start(app.clone(), port);
    }
}

async fn run_bridge_server(
    app: AppHandle,
    listener: TcpListener,
    session_token: String,
    mut shutdown: oneshot::Receiver<()>,
) {
    loop {
        tokio::select! {
            _ = &mut shutdown => break,
            accepted = listener.accept() => {
                let Ok((stream, addr)) = accepted else {
                    continue;
                };
                if !addr.ip().is_loopback() {
                    continue;
                }
                let app = app.clone();
                let token = session_token.clone();
                tauri::async_runtime::spawn(async move {
                    let _ = handle_bridge_connection(app, stream, addr, token).await;
                });
            }
        }
    }
}

async fn handle_bridge_connection(
    app: AppHandle,
    mut stream: TcpStream,
    addr: SocketAddr,
    session_token: String,
) -> Result<(), String> {
    let request = read_http_request(&mut stream).await?;
    let tool = request.path.trim_start_matches('/').to_string();
    let is_status = tool == "loftp_get_status" || tool == "status";
    if !is_status && !request.is_authorized(&session_token) {
        write_json_response(&mut stream, 401, json!({ "error": "Unauthorized" })).await?;
        audit(&tool, false, Some("Unauthorized"));
        return Ok(());
    }

    let body = if request.body.trim().is_empty() {
        json!({})
    } else {
        serde_json::from_str::<Value>(&request.body).unwrap_or_else(|_| json!({}))
    };

    let result = handle_bridge_tool(app, &tool, body).await;
    match result {
        Ok(value) => {
            write_json_response(&mut stream, 200, redact_value(value)).await?;
            audit(&tool, true, None);
        }
        Err(error) => {
            write_json_response(&mut stream, 400, json!({ "error": redact_text(&error) })).await?;
            audit(&tool, false, Some(&error));
        }
    }

    let _ = addr;
    Ok(())
}

async fn handle_bridge_tool(app: AppHandle, tool: &str, body: Value) -> Result<Value, String> {
    match tool {
        "loftp_get_status" | "status" => Ok(json!({
            "name": "LoFTP Codex bridge",
            "ok": true,
            "bind": "127.0.0.1",
            "secretsExposed": false,
            "requiresToken": true,
        })),
        "loftp_list_hostings" => Ok(json!({ "hostings": codex_list_hostings() })),
        "loftp_get_active_context" => Ok(json!({
            "activeContext": null,
            "note": "Active UI panel context is available inside LoFTP UI; bridge responses never include credentials."
        })),
        "loftp_list_local" => {
            let path = string_arg(&body, "path")?;
            Ok(json!({ "path": path, "items": list_local_metadata(&path)? }))
        }
        "loftp_list_remote" => {
            let hosting_id = string_arg(&body, "hostingId")?;
            let path = string_arg(&body, "path")?;
            Ok(json!({ "path": path, "items": list_remote_metadata(&app, &hosting_id, &path).await? }))
        }
        "loftp_read_text_file_preview" => {
            let path = string_arg(&body, "path")?;
            let max_bytes = body.get("maxBytes").and_then(Value::as_u64).unwrap_or(80_000) as usize;
            Ok(json!({ "path": path, "preview": read_text_preview(&path, max_bytes)? }))
        }
        "loftp_scan_for_secrets" => {
            let path = string_arg(&body, "path")?;
            Ok(json!({ "path": path, "findings": scan_for_secrets(&path)? }))
        }
        "loftp_analyze_project" => {
            let path = string_arg(&body, "path")?;
            Ok(analyze_project(&path))
        }
        "loftp_detect_build_output" => {
            let path = string_arg(&body, "path")?;
            Ok(detect_build_output(&path))
        }
        "loftp_compare_paths" => {
            let local_path = string_arg(&body, "localPath")?;
            let remote_path = string_arg(&body, "remotePath")?;
            let hosting_id = string_arg(&body, "hostingId")?;
            let local = list_local_metadata(&local_path)?;
            let remote = list_remote_metadata(&app, &hosting_id, &remote_path).await?;
            Ok(compare_metadata(local, remote))
        }
        "loftp_create_upload_plan" | "loftp_create_sync_plan" => {
            let local_path = string_arg(&body, "localPath")?;
            let remote_path = string_arg(&body, "remotePath")?;
            let hosting_id = body.get("hostingId").and_then(Value::as_str).map(|s| s.to_string());
            let plan = create_upload_plan(&local_path, &remote_path, hosting_id)?;
            serde_json::to_value(plan).map_err(|e| e.to_string())
        }
        "loftp_execute_plan" => {
            let approved = body.get("approved").and_then(Value::as_bool).unwrap_or(false);
            let plan_value = body.get("plan").cloned().ok_or_else(|| "Missing plan".to_string())?;
            let plan: CodexPlan = serde_json::from_value(plan_value).map_err(|e| e.to_string())?;
            if plan.requires_confirmation && !approved {
                return Err("Plan requires explicit LoFTP UI confirmation before execution.".to_string());
            }
            Ok(json!({
                "planId": plan.id,
                "status": "accepted",
                "executed": false,
                "note": "Execution handoff is intentionally gated for LoFTP UI confirmation."
            }))
        }
        "loftp_run_build_command" => {
            if !body.get("approved").and_then(Value::as_bool).unwrap_or(false) {
                return Err("Build commands require explicit LoFTP UI confirmation.".to_string());
            }
            Err("Build execution is prepared as a confirmed plan step; direct bridge execution is disabled in this build.".to_string())
        }
        "loftp_explain_build_error" => Ok(json!({
            "explanation": "Provide the build log in the request body under `log`; LoFTP will return a masked summary.",
            "maskedLog": body.get("log").and_then(Value::as_str).map(redact_text)
        })),
        "loftp_get_transfer_status" => Ok(json!({
            "transfers": [],
            "note": "Live transfer state is emitted in the LoFTP UI; bridge transfer polling will be wired to the audit trail next."
        })),
        "loftp_cancel_transfer" => Err("Transfer cancellation is available through LoFTP UI and Tauri command state.".to_string()),
        "loftp_upload_file" | "loftp_upload_dir" | "loftp_download_file" | "loftp_download_dir" | "loftp_mkdir" | "loftp_rename" | "loftp_delete" => {
            Err("Direct mutation endpoints require a confirmed plan. Use create_*_plan then execute_plan.".to_string())
        }
        _ => Err(format!("Unknown LoFTP bridge tool: {}", tool)),
    }
}

struct HttpRequest {
    path: String,
    headers: Vec<(String, String)>,
    body: String,
}

impl HttpRequest {
    fn is_authorized(&self, session_token: &str) -> bool {
        self.headers.iter().any(|(key, value)| {
            let key = key.to_ascii_lowercase();
            (key == "authorization" && value.trim() == format!("Bearer {}", session_token))
                || (key == "x-loftp-token" && value.trim() == session_token)
        })
    }
}

async fn read_http_request(stream: &mut TcpStream) -> Result<HttpRequest, String> {
    let mut buffer = Vec::new();
    let mut temp = [0u8; 4096];
    loop {
        let n = stream.read(&mut temp).await.map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        buffer.extend_from_slice(&temp[..n]);
        if buffer.windows(4).any(|window| window == b"\r\n\r\n") {
            break;
        }
        if buffer.len() > 1024 * 1024 {
            return Err("Bridge request is too large".to_string());
        }
    }

    let header_end = buffer
        .windows(4)
        .position(|window| window == b"\r\n\r\n")
        .map(|pos| pos + 4)
        .ok_or_else(|| "Invalid HTTP request".to_string())?;
    let headers_raw = String::from_utf8_lossy(&buffer[..header_end]).to_string();
    let mut lines = headers_raw.lines();
    let request_line = lines
        .next()
        .ok_or_else(|| "Missing request line".to_string())?;
    let path = request_line
        .split_whitespace()
        .nth(1)
        .unwrap_or("/")
        .split('?')
        .next()
        .unwrap_or("/")
        .to_string();

    let headers: Vec<(String, String)> = lines
        .filter_map(|line| {
            let (key, value) = line.split_once(':')?;
            Some((key.trim().to_string(), value.trim().to_string()))
        })
        .collect();
    let content_length = headers
        .iter()
        .find(|(key, _)| key.eq_ignore_ascii_case("content-length"))
        .and_then(|(_, value)| value.parse::<usize>().ok())
        .unwrap_or(0);

    while buffer.len() < header_end + content_length {
        let n = stream.read(&mut temp).await.map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        buffer.extend_from_slice(&temp[..n]);
    }

    let body =
        String::from_utf8_lossy(&buffer[header_end..buffer.len().min(header_end + content_length)])
            .to_string();
    Ok(HttpRequest {
        path,
        headers,
        body,
    })
}

async fn write_json_response(
    stream: &mut TcpStream,
    status: u16,
    value: Value,
) -> Result<(), String> {
    let reason = if status == 200 {
        "OK"
    } else if status == 401 {
        "Unauthorized"
    } else {
        "Bad Request"
    };
    let body = serde_json::to_string_pretty(&value).map_err(|e| e.to_string())?;
    let response = format!(
        "HTTP/1.1 {} {}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        status,
        reason,
        body.as_bytes().len(),
        body
    );
    stream
        .write_all(response.as_bytes())
        .await
        .map_err(|e| e.to_string())
}

fn string_arg(body: &Value, key: &str) -> Result<String, String> {
    body.get(key)
        .and_then(Value::as_str)
        .map(|s| s.to_string())
        .ok_or_else(|| format!("Missing `{}`", key))
}

fn list_local_metadata(path: &str) -> Result<Vec<FileItem>, String> {
    let mut items = Vec::new();
    for entry in fs::read_dir(path).map_err(|e| format!("Read local directory failed: {}", e))? {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        items.push(FileItem {
            name: entry.file_name().to_string_lossy().to_string(),
            size: if metadata.is_file() {
                metadata.len()
            } else {
                0
            },
            modified: metadata
                .modified()
                .ok()
                .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|duration| duration.as_secs().to_string())
                .unwrap_or_else(|| "—".to_string()),
            is_directory: metadata.is_dir(),
            permissions: None,
            is_symlink: None,
            symlink_target: None,
            resolved_path: None,
            entry_path: None,
        });
    }
    Ok(items)
}

async fn list_remote_metadata(
    app: &AppHandle,
    hosting_id: &str,
    path: &str,
) -> Result<Vec<FileItem>, String> {
    let hosting = config_store::load_hostings()
        .into_iter()
        .find(|hosting| hosting.id == hosting_id)
        .ok_or_else(|| "Hosting profile not found".to_string())?;

    match hosting.protocol {
        Protocol::Ftp | Protocol::Ftps => {
            let state = app.state::<FtpState>();
            let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
            let session = sessions
                .get_mut(hosting_id)
                .ok_or_else(|| "FTP profile is not connected in LoFTP".to_string())?;
            session.list_dir(path)
        }
        Protocol::Sftp => {
            let state = app.state::<SftpState>();
            let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
            let session = sessions
                .get_mut(hosting_id)
                .ok_or_else(|| "SFTP profile is not connected in LoFTP".to_string())?;
            session.list_dir(path)
        }
        Protocol::BunnyStorage => {
            let state = app.state::<BunnyStorageState>();
            let session = {
                let sessions = state.sessions.lock().map_err(|e| e.to_string())?;
                sessions
                    .get(hosting_id)
                    .cloned()
                    .ok_or_else(|| "Bunny Storage profile is not connected in LoFTP".to_string())?
            };
            session.list_dir(path).await
        }
    }
}

fn read_text_preview(path: &str, max_bytes: usize) -> Result<String, String> {
    let bytes = fs::read(path).map_err(|e| format!("Read preview failed: {}", e))?;
    let clipped = &bytes[..bytes.len().min(max_bytes)];
    Ok(redact_text(&String::from_utf8_lossy(clipped)))
}

fn scan_for_secrets(path: &str) -> Result<Vec<Value>, String> {
    let mut findings = Vec::new();
    let paths: Vec<PathBuf> = if Path::new(path).is_dir() {
        walkdir::WalkDir::new(path)
            .max_depth(4)
            .into_iter()
            .filter_map(Result::ok)
            .filter(|entry| entry.file_type().is_file())
            .map(|entry| entry.path().to_path_buf())
            .collect()
    } else {
        vec![PathBuf::from(path)]
    };

    for file in paths.into_iter().take(500) {
        let Ok(raw) = fs::read_to_string(&file) else {
            continue;
        };
        for (line_index, line) in raw.lines().enumerate() {
            let lower = line.to_ascii_lowercase();
            if lower.contains("api_key")
                || lower.contains("apikey")
                || lower.contains("access_key")
                || lower.contains("password")
                || lower.contains("secret")
                || lower.contains("token")
                || file
                    .file_name()
                    .map(|name| name.to_string_lossy() == ".env")
                    .unwrap_or(false)
            {
                findings.push(json!({
                    "path": file.to_string_lossy(),
                    "line": line_index + 1,
                    "preview": redact_text(line)
                }));
            }
        }
    }

    Ok(findings)
}

fn analyze_project(path: &str) -> Value {
    let root = Path::new(path);
    let has = |name: &str| root.join(name).exists();
    let project_type = if has("next.config.js") || has("next.config.mjs") || has("next.config.ts") {
        "next"
    } else if has("vite.config.js") || has("vite.config.ts") || has("vite.config.mjs") {
        "vite"
    } else if has("Cargo.toml") {
        "rust"
    } else if has("composer.json") {
        "php-composer"
    } else if has("pyproject.toml") {
        "python"
    } else if has("package.json") {
        "node"
    } else {
        "static-or-unknown"
    };

    let build_command = match project_type {
        "next" | "vite" | "node" => "npm run build",
        "rust" => "cargo build --release",
        "php-composer" => "composer install --no-dev --optimize-autoloader",
        "python" => "python -m build",
        _ => "",
    };

    json!({
        "path": path,
        "projectType": project_type,
        "suggestedBuildCommand": build_command,
        "buildOutput": detect_build_output(path),
        "riskHints": deployment_risks(root)
    })
}

fn detect_build_output(path: &str) -> Value {
    let root = Path::new(path);
    let candidates = [
        "dist",
        "build",
        ".output/public",
        "out",
        "public",
        "target/release",
    ];
    let matches: Vec<Value> = candidates
        .iter()
        .filter_map(|candidate| {
            let full = root.join(candidate);
            if full.exists() {
                Some(json!({ "path": full.to_string_lossy(), "candidate": candidate }))
            } else {
                None
            }
        })
        .collect();
    json!({ "matches": matches })
}

fn deployment_risks(root: &Path) -> Vec<String> {
    let mut risks = Vec::new();
    for name in [".env", ".env.local", "node_modules", ".git", "debug.log"] {
        if root.join(name).exists() {
            risks.push(format!("Review `{}` before upload.", name));
        }
    }
    risks
}

fn create_upload_plan(
    local_path: &str,
    remote_path: &str,
    hosting_id: Option<String>,
) -> Result<CodexPlan, String> {
    let mut actions = Vec::new();
    let mut risks = Vec::new();
    let root = Path::new(local_path);

    if root.is_file() {
        let size = fs::metadata(root).map(|m| m.len()).unwrap_or(0);
        actions.push(CodexPlanAction {
            action_type: "uploadFile".to_string(),
            local_path: Some(local_path.to_string()),
            remote_path: Some(remote_path.to_string()),
            size: Some(size),
            destructive: true,
        });
    } else {
        for entry in walkdir::WalkDir::new(root)
            .into_iter()
            .filter_map(Result::ok)
            .filter(|entry| entry.file_type().is_file())
        {
            let rel = entry.path().strip_prefix(root).map_err(|e| e.to_string())?;
            let remote = format!(
                "{}/{}",
                remote_path.trim_end_matches('/'),
                rel.to_string_lossy()
            );
            let local = entry.path().to_string_lossy().to_string();
            let lower = local.to_ascii_lowercase();
            if lower.contains(".env")
                || lower.contains("node_modules")
                || lower.ends_with(".map")
                || lower.contains("/.git/")
            {
                risks.push(format!(
                    "Review risky file before upload: {}",
                    rel.to_string_lossy()
                ));
            }
            actions.push(CodexPlanAction {
                action_type: "uploadFile".to_string(),
                local_path: Some(local),
                remote_path: Some(remote),
                size: fs::metadata(entry.path()).ok().map(|m| m.len()),
                destructive: true,
            });
        }
    }

    Ok(CodexPlan {
        id: Uuid::new_v4().to_string(),
        kind: "upload".to_string(),
        hosting_id,
        local_base_path: Some(local_path.to_string()),
        remote_base_path: Some(remote_path.to_string()),
        actions,
        risks,
        requires_confirmation: true,
    })
}

fn compare_metadata(local: Vec<FileItem>, remote: Vec<FileItem>) -> Value {
    let remote_names: std::collections::HashSet<String> =
        remote.iter().map(|item| item.name.clone()).collect();
    let local_names: std::collections::HashSet<String> =
        local.iter().map(|item| item.name.clone()).collect();
    let new_files: Vec<String> = local_names.difference(&remote_names).cloned().collect();
    let remote_only: Vec<String> = remote_names.difference(&local_names).cloned().collect();
    let common: Vec<String> = local_names.intersection(&remote_names).cloned().collect();
    json!({ "new": new_files, "remoteOnly": remote_only, "common": common })
}

fn redact_value(value: Value) -> Value {
    match value {
        Value::String(value) => Value::String(redact_text(&value)),
        Value::Array(items) => Value::Array(items.into_iter().map(redact_value).collect()),
        Value::Object(map) => Value::Object(
            map.into_iter()
                .map(|(key, value)| {
                    let lower = key.to_ascii_lowercase();
                    if lower.contains("password")
                        || lower.contains("secret")
                        || lower.contains("token")
                        || lower.contains("accesskey")
                        || lower.contains("api_key")
                    {
                        (key, Value::String("[masked]".to_string()))
                    } else {
                        (key, redact_value(value))
                    }
                })
                .collect(),
        ),
        other => other,
    }
}

fn redact_text(input: &str) -> String {
    input
        .lines()
        .map(|line| {
            let lower = line.to_ascii_lowercase();
            if lower.contains("password")
                || lower.contains("secret")
                || lower.contains("token")
                || lower.contains("api_key")
                || lower.contains("apikey")
                || lower.contains("access_key")
            {
                match line.split_once('=') {
                    Some((key, _)) => format!("{}=[masked]", key.trim()),
                    None => "[masked secret-like line]".to_string(),
                }
            } else {
                line.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn audit(tool: &str, ok: bool, error: Option<&str>) {
    let path = app_data_dir().join("codex_audit.jsonl");
    let value = json!({
        "ts": chrono::Utc::now().to_rfc3339(),
        "tool": tool,
        "ok": ok,
        "error": error.map(redact_text),
    });
    if let Ok(mut file) = fs::OpenOptions::new().create(true).append(true).open(path) {
        let _ = writeln!(file, "{}", value);
    }
}
