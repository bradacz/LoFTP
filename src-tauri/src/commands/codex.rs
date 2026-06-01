use crate::commands::bunny_storage::BunnyStorageState;
use crate::commands::ftp::FtpState;
use crate::commands::sftp::SftpState;
use crate::models::file_item::FileItem;
use crate::models::hosting::Protocol;
use crate::models::transfer::{CancellationState, TransferRegistry, TransferStatus};
use crate::services::config_store;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    collections::HashMap,
    fs,
    io::{Read, Write},
    net::SocketAddr,
    path::{Path, PathBuf},
    process::Command,
    sync::Mutex,
    time::SystemTime,
};
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::{TcpListener, TcpStream},
    sync::oneshot,
    time::{timeout, Duration},
};
use uuid::Uuid;

const MAX_HEADER_BYTES: usize = 64 * 1024;
const MAX_BODY_BYTES: usize = 512 * 1024;
const MAX_PREVIEW_BYTES: usize = 128 * 1024;
const MAX_SECRET_SCAN_FILES: usize = 500;
const MAX_SECRET_SCAN_FILE_BYTES: usize = 128 * 1024;
const MAX_SYNC_FILES: usize = 10_000;
const MAX_SYNC_DEPTH: usize = 24;
const MAX_BUILD_LOG_BYTES: usize = 256 * 1024;
const BRIDGE_READ_TIMEOUT: Duration = Duration::from_secs(10);

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
    active_context: Mutex<CodexActiveContext>,
    pending_plans: Mutex<HashMap<String, CodexPlan>>,
    pending_builds: Mutex<HashMap<String, CodexBuildRequest>>,
}

struct CodexBridgeRuntime {
    port: u16,
    session_token: String,
    shutdown: Option<oneshot::Sender<()>>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexActiveContext {
    #[serde(default)]
    pub active_local_path: Option<String>,
    #[serde(default)]
    pub active_remote_path: Option<String>,
    #[serde(default)]
    pub active_hosting_id: Option<String>,
    #[serde(default)]
    pub local_roots: Vec<String>,
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
    #[serde(default, skip_serializing_if = "Option::is_none")]
    reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CodexBuildRequest {
    id: String,
    command: String,
    working_dir: String,
}

#[derive(Debug, Clone)]
struct SyncEntry {
    rel_path: String,
    full_path: Option<String>,
    size: u64,
    is_directory: bool,
    modified: Option<i64>,
}

impl CodexBridgeState {
    pub fn new() -> Self {
        Self {
            runtime: Mutex::new(None),
            active_context: Mutex::new(CodexActiveContext::default()),
            pending_plans: Mutex::new(HashMap::new()),
            pending_builds: Mutex::new(HashMap::new()),
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
        let token = Uuid::new_v4().to_string();
        let task_token = token.clone();
        let (tx, rx) = oneshot::channel();

        tauri::async_runtime::spawn(async move {
            let listener = match TcpListener::from_std(std_listener) {
                Ok(listener) => listener,
                Err(error) => {
                    let _ = app.emit(
                        "loftp-codex-bridge-error",
                        json!({ "error": format!("Codex bridge listener failed: {}", error) }),
                    );
                    return;
                }
            };
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

    fn update_active_context(&self, context: CodexActiveContext) {
        if let Ok(mut active_context) = self.active_context.lock() {
            *active_context = context;
        }
    }

    fn active_context(&self) -> CodexActiveContext {
        self.active_context
            .lock()
            .map(|context| context.clone())
            .unwrap_or_default()
    }

    fn store_pending_plan(&self, plan: CodexPlan) {
        if let Ok(mut pending_plans) = self.pending_plans.lock() {
            pending_plans.insert(plan.id.clone(), plan);
        }
    }

    fn get_pending_plan(&self, plan_id: &str) -> Option<CodexPlan> {
        self.pending_plans
            .lock()
            .ok()
            .and_then(|pending_plans| pending_plans.get(plan_id).cloned())
    }

    fn take_pending_plan(&self, plan_id: &str) -> Option<CodexPlan> {
        self.pending_plans
            .lock()
            .ok()
            .and_then(|mut pending_plans| pending_plans.remove(plan_id))
    }

    fn store_pending_build(&self, request: CodexBuildRequest) {
        if let Ok(mut pending_builds) = self.pending_builds.lock() {
            pending_builds.insert(request.id.clone(), request);
        }
    }

    fn take_pending_build(&self, request_id: &str) -> Option<CodexBuildRequest> {
        self.pending_builds
            .lock()
            .ok()
            .and_then(|mut pending_builds| pending_builds.remove(request_id))
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

#[tauri::command]
pub fn codex_update_active_context(
    state: State<'_, CodexBridgeState>,
    context: CodexActiveContext,
) -> Result<(), String> {
    state.update_active_context(context);
    Ok(())
}

#[tauri::command]
pub async fn codex_execute_pending_plan(
    app: AppHandle,
    state: State<'_, CodexBridgeState>,
    plan_id: String,
) -> Result<Value, String> {
    let plan = state
        .take_pending_plan(&plan_id)
        .ok_or_else(|| "Pending Codex plan not found or already executed".to_string())?;
    execute_plan(&app, &plan).await
}

#[tauri::command]
pub async fn codex_execute_pending_build(
    state: State<'_, CodexBridgeState>,
    request_id: String,
) -> Result<Value, String> {
    let request = state
        .take_pending_build(&request_id)
        .ok_or_else(|| "Pending Codex build not found or already executed".to_string())?;
    execute_build_request(&request)
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
        let port = if settings.port == 0 {
            17642
        } else {
            settings.port
        };
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
    let mut request = read_http_head(&mut stream).await?;
    if !matches!(request.method.as_str(), "GET" | "POST") {
        write_json_response(&mut stream, 405, json!({ "error": "Method not allowed" })).await?;
        return Ok(());
    }

    let tool = request.path.trim_start_matches('/').to_string();
    let is_status = tool == "loftp_get_status" || tool == "status";
    if !is_status && !request.is_authorized(&session_token) {
        write_json_response(&mut stream, 401, json!({ "error": "Unauthorized" })).await?;
        audit(&tool, false, Some("Unauthorized"));
        return Ok(());
    }

    let body_text = read_http_body(
        &mut stream,
        std::mem::take(&mut request.initial_body),
        request.content_length,
    )
    .await?;
    let body = if body_text.trim().is_empty() {
        json!({})
    } else {
        serde_json::from_str::<Value>(&body_text).unwrap_or_else(|_| json!({}))
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
        "loftp_get_active_context" => {
            let state = app.state::<CodexBridgeState>();
            Ok(json!({
                "activeContext": state.active_context(),
                "note": "Bridge local file access is limited to the active LoFTP local panel roots. Credentials are never included."
            }))
        }
        "loftp_list_local" => {
            let path = string_arg(&body, "path")?;
            let path = resolve_allowed_local_path(&app, &path)?;
            Ok(json!({ "path": path, "items": list_local_metadata(&path)? }))
        }
        "loftp_list_remote" => {
            let hosting_id = string_arg(&body, "hostingId")?;
            let path = string_arg(&body, "path")?;
            Ok(json!({ "path": path, "items": list_remote_metadata(&app, &hosting_id, &path).await? }))
        }
        "loftp_read_text_file_preview" => {
            let path = string_arg(&body, "path")?;
            let path = resolve_allowed_local_path(&app, &path)?;
            let max_bytes = body
                .get("maxBytes")
                .and_then(Value::as_u64)
                .unwrap_or(80_000) as usize;
            Ok(json!({ "path": path, "preview": read_text_preview(&path, max_bytes)? }))
        }
        "loftp_scan_for_secrets" => {
            let path = string_arg(&body, "path")?;
            let path = resolve_allowed_local_path(&app, &path)?;
            Ok(json!({ "path": path, "findings": scan_for_secrets(&path)? }))
        }
        "loftp_analyze_project" => {
            let path = string_arg(&body, "path")?;
            let path = resolve_allowed_local_path(&app, &path)?;
            Ok(analyze_project(&path))
        }
        "loftp_detect_build_output" => {
            let path = string_arg(&body, "path")?;
            let path = resolve_allowed_local_path(&app, &path)?;
            Ok(detect_build_output(&path))
        }
        "loftp_compare_paths" => {
            let local_path = string_arg(&body, "localPath")?;
            let remote_path = string_arg(&body, "remotePath")?;
            let hosting_id = string_arg(&body, "hostingId")?;
            let local_path = resolve_allowed_local_path(&app, &local_path)?;
            let local = list_local_metadata(&local_path)?;
            let remote = list_remote_metadata(&app, &hosting_id, &remote_path).await?;
            Ok(compare_metadata(local, remote))
        }
        "loftp_create_upload_plan" => {
            let local_path = string_arg(&body, "localPath")?;
            let remote_path = string_arg(&body, "remotePath")?;
            let hosting_id = body.get("hostingId").and_then(Value::as_str).map(|s| s.to_string());
            let local_path = resolve_allowed_local_path(&app, &local_path)?;
            let plan = create_upload_plan(&local_path, &remote_path, hosting_id)?;
            app.state::<CodexBridgeState>().store_pending_plan(plan.clone());
            serde_json::to_value(plan).map_err(|e| e.to_string())
        }
        "loftp_create_sync_plan" => {
            let local_path = string_arg(&body, "localPath")?;
            let remote_path = string_arg(&body, "remotePath")?;
            let hosting_id = string_arg(&body, "hostingId")?;
            let direction = body
                .get("direction")
                .and_then(Value::as_str)
                .unwrap_or("localToRemote");
            let include_deletes = body
                .get("includeDeletes")
                .and_then(Value::as_bool)
                .unwrap_or(false);
            let local_path = resolve_allowed_local_path(&app, &local_path)?;
            let plan = if direction == "remoteToLocal" {
                create_remote_to_local_sync_plan(
                    &app,
                    &local_path,
                    &remote_path,
                    &hosting_id,
                    include_deletes,
                )
                .await?
            } else {
                create_sync_plan(&app, &local_path, &remote_path, &hosting_id, include_deletes)
                    .await?
            };
            app.state::<CodexBridgeState>().store_pending_plan(plan.clone());
            serde_json::to_value(plan).map_err(|e| e.to_string())
        }
        "loftp_execute_plan" => {
            let state = app.state::<CodexBridgeState>();
            let plan = if let Some(plan_id) = body.get("planId").and_then(Value::as_str) {
                state
                    .get_pending_plan(plan_id)
                    .ok_or_else(|| "Pending Codex plan not found".to_string())?
            } else {
                let plan_value = body.get("plan").cloned().ok_or_else(|| "Missing plan".to_string())?;
                let plan: CodexPlan = serde_json::from_value(plan_value).map_err(|e| e.to_string())?;
                state.store_pending_plan(plan.clone());
                plan
            };
            emit_pending_plan(&app, &plan)?;
            Ok(json!({
                "planId": plan.id,
                "status": "requiresUiConfirmation",
                "executed": false,
                "note": "Plan was handed to LoFTP UI. Confirm it in LoFTP before any mutation runs.",
                "changeReport": change_report_from_plan(&plan, false)
            }))
        }
        "loftp_run_build_command" => {
            let command = string_arg(&body, "command")?;
            let working_dir = body
                .get("workingDir")
                .or_else(|| body.get("path"))
                .and_then(Value::as_str)
                .ok_or_else(|| "Missing `workingDir`".to_string())?;
            let working_dir = resolve_allowed_local_path(&app, working_dir)?;
            validate_build_command(&command)?;
            let request = CodexBuildRequest {
                id: Uuid::new_v4().to_string(),
                command,
                working_dir,
            };
            app.state::<CodexBridgeState>()
                .store_pending_build(request.clone());
            emit_pending_build(&app, &request)?;
            Ok(json!({
                "requestId": request.id,
                "status": "requiresUiConfirmation",
                "executed": false,
                "note": "Build command was handed to LoFTP UI. Confirm it in LoFTP before it runs."
            }))
        }
        "loftp_explain_build_error" => Ok(json!({
            "explanation": "Provide the build log in the request body under `log`; LoFTP will return a masked summary.",
            "maskedLog": body.get("log").and_then(Value::as_str).map(redact_text)
        })),
        "loftp_get_transfer_status" => {
            let registry = app.state::<TransferRegistry>();
            if let Some(transfer_id) = body.get("transferId").and_then(Value::as_str) {
                Ok(json!({ "transfer": registry.get(transfer_id) }))
            } else {
                Ok(json!({ "transfers": registry.list() }))
            }
        }
        "loftp_cancel_transfer" => {
            let transfer_id = string_arg(&body, "transferId")?;
            let cancelled = app.state::<CancellationState>().cancel(&transfer_id);
            let registry = app.state::<TransferRegistry>();
            let transfer = registry.get(&transfer_id).map(|mut progress| {
                if cancelled {
                    progress.status = TransferStatus::Cancelled;
                    registry.record(progress.clone());
                }
                progress
            });
            Ok(json!({ "transferId": transfer_id, "cancelled": cancelled, "transfer": transfer }))
        }
        "loftp_get_change_report" => {
            if let Some(plan_value) = body.get("plan").cloned() {
                let plan: CodexPlan = serde_json::from_value(plan_value).map_err(|e| e.to_string())?;
                Ok(change_report_from_plan(&plan, false))
            } else if let Some(transfer_id) = body.get("transferId").and_then(Value::as_str) {
                Ok(change_report_from_transfer(app.state::<TransferRegistry>().get(transfer_id)))
            } else {
                Err("Provide `plan` or `transferId` for change report.".to_string())
            }
        }
        "loftp_upload_file" | "loftp_upload_dir" | "loftp_download_file" | "loftp_download_dir" | "loftp_mkdir" | "loftp_rename" | "loftp_delete" => {
            Err("Direct mutation endpoints require a confirmed plan. Use create_*_plan then execute_plan.".to_string())
        }
        _ => Err(format!("Unknown LoFTP bridge tool: {}", tool)),
    }
}

struct HttpRequestHead {
    method: String,
    path: String,
    headers: Vec<(String, String)>,
    content_length: usize,
    initial_body: Vec<u8>,
}

impl HttpRequestHead {
    fn is_authorized(&self, session_token: &str) -> bool {
        self.headers.iter().any(|(key, value)| {
            let key = key.to_ascii_lowercase();
            (key == "authorization" && value.trim() == format!("Bearer {}", session_token))
                || (key == "x-loftp-token" && value.trim() == session_token)
        })
    }
}

async fn read_http_head(stream: &mut TcpStream) -> Result<HttpRequestHead, String> {
    let mut buffer = Vec::new();
    let mut temp = [0u8; 4096];
    loop {
        let n = timeout(BRIDGE_READ_TIMEOUT, stream.read(&mut temp))
            .await
            .map_err(|_| "Bridge request timed out".to_string())?
            .map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        buffer.extend_from_slice(&temp[..n]);
        if buffer.windows(4).any(|window| window == b"\r\n\r\n") {
            break;
        }
        if buffer.len() > MAX_HEADER_BYTES {
            return Err("Bridge request headers are too large".to_string());
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
    let method = request_line
        .split_whitespace()
        .next()
        .unwrap_or("GET")
        .to_ascii_uppercase();
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

    if content_length > MAX_BODY_BYTES {
        return Err("Bridge request body is too large".to_string());
    }

    let mut initial_body = buffer[header_end..].to_vec();
    initial_body.truncate(content_length);

    Ok(HttpRequestHead {
        method,
        path,
        headers,
        content_length,
        initial_body,
    })
}

async fn read_http_body(
    stream: &mut TcpStream,
    mut body: Vec<u8>,
    content_length: usize,
) -> Result<String, String> {
    if content_length > MAX_BODY_BYTES {
        return Err("Bridge request body is too large".to_string());
    }

    let mut temp = [0u8; 4096];
    while body.len() < content_length {
        let n = timeout(BRIDGE_READ_TIMEOUT, stream.read(&mut temp))
            .await
            .map_err(|_| "Bridge request body timed out".to_string())?
            .map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        body.extend_from_slice(&temp[..n]);
        if body.len() > MAX_BODY_BYTES {
            return Err("Bridge request body is too large".to_string());
        }
    }

    body.truncate(content_length);
    Ok(String::from_utf8_lossy(&body).to_string())
}

async fn write_json_response(
    stream: &mut TcpStream,
    status: u16,
    value: Value,
) -> Result<(), String> {
    let reason = match status {
        200 => "OK",
        401 => "Unauthorized",
        405 => "Method Not Allowed",
        413 => "Payload Too Large",
        _ => "Bad Request",
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

fn resolve_allowed_local_path(app: &AppHandle, path: &str) -> Result<String, String> {
    let target = fs::canonicalize(path).map_err(|e| format!("Resolve local path failed: {}", e))?;
    let roots = allowed_local_roots(app);

    if roots.is_empty() {
        return Err(
            "No active LoFTP local context is available. Open the target folder in a LoFTP local panel first."
                .to_string(),
        );
    }

    if roots.iter().any(|root| target.starts_with(root)) {
        return Ok(target.to_string_lossy().to_string());
    }

    Err("Local path is outside the active LoFTP local context".to_string())
}

fn resolve_allowed_local_path_for_write(app: &AppHandle, path: &str) -> Result<String, String> {
    if Path::new(path).exists() {
        return resolve_allowed_local_path(app, path);
    }

    let target = PathBuf::from(path);
    if !target.is_absolute()
        || target
            .components()
            .any(|component| matches!(component, std::path::Component::ParentDir))
    {
        return Err(
            "Local write path must be an absolute path without parent traversal".to_string(),
        );
    }

    let mut ancestor = target
        .parent()
        .ok_or_else(|| "Local path is missing parent directory".to_string())?
        .to_path_buf();
    while !ancestor.exists() {
        ancestor = ancestor
            .parent()
            .ok_or_else(|| "Local path has no existing parent directory".to_string())?
            .to_path_buf();
    }

    let ancestor = fs::canonicalize(ancestor)
        .map_err(|e| format!("Resolve local parent path failed: {}", e))?;
    let roots = allowed_local_roots(app);

    if roots.iter().any(|root| ancestor.starts_with(root)) {
        return Ok(target.to_string_lossy().to_string());
    }

    Err("Local write path is outside the active LoFTP local context".to_string())
}

fn allowed_local_roots(app: &AppHandle) -> Vec<PathBuf> {
    let state = app.state::<CodexBridgeState>();
    let context = state.active_context();
    let mut roots: Vec<PathBuf> = context
        .local_roots
        .iter()
        .filter_map(|root| fs::canonicalize(root).ok())
        .collect();

    if let Some(env_roots) = std::env::var_os("LOFTP_CODEX_ALLOWED_ROOTS") {
        roots.extend(
            std::env::split_paths(&env_roots).filter_map(|root| fs::canonicalize(root).ok()),
        );
    }

    roots.sort();
    roots.dedup();
    roots
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
    let max_bytes = max_bytes.min(MAX_PREVIEW_BYTES);
    let file = fs::File::open(path).map_err(|e| format!("Read preview failed: {}", e))?;
    let mut bytes = Vec::with_capacity(max_bytes);
    file.take(max_bytes as u64)
        .read_to_end(&mut bytes)
        .map_err(|e| format!("Read preview failed: {}", e))?;
    Ok(redact_text(&String::from_utf8_lossy(&bytes)))
}

fn scan_for_secrets(path: &str) -> Result<Vec<Value>, String> {
    let mut findings = Vec::new();
    let paths: Vec<PathBuf> = if Path::new(path).is_dir() {
        walkdir::WalkDir::new(path)
            .max_depth(4)
            .into_iter()
            .filter_entry(|entry| !should_skip_secret_scan_entry(entry.path()))
            .filter_map(Result::ok)
            .filter(|entry| entry.file_type().is_file())
            .map(|entry| entry.path().to_path_buf())
            .collect()
    } else {
        vec![PathBuf::from(path)]
    };

    for file in paths.into_iter().take(MAX_SECRET_SCAN_FILES) {
        let Ok(raw) = read_limited_text(&file, MAX_SECRET_SCAN_FILE_BYTES) else {
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
                    .map(|name| name.to_string_lossy().starts_with(".env"))
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

fn read_limited_text(path: &Path, max_bytes: usize) -> Result<String, String> {
    let file = fs::File::open(path).map_err(|e| e.to_string())?;
    let mut bytes = Vec::with_capacity(max_bytes);
    file.take(max_bytes as u64)
        .read_to_end(&mut bytes)
        .map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&bytes).to_string())
}

fn should_skip_secret_scan_entry(path: &Path) -> bool {
    path.file_name()
        .map(|name| {
            matches!(
                name.to_string_lossy().as_ref(),
                ".git" | "node_modules" | "target" | "dist" | "build" | ".next" | ".cache"
            )
        })
        .unwrap_or(false)
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
            reason: Some("Single file upload may overwrite a remote file.".to_string()),
        });
    } else {
        for entry in walkdir::WalkDir::new(root)
            .max_depth(MAX_SYNC_DEPTH + 1)
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
                reason: Some("Upload plan action.".to_string()),
            });
            if actions.len() > MAX_SYNC_FILES {
                return Err(format!(
                    "Upload plan exceeds the {} file limit",
                    MAX_SYNC_FILES
                ));
            }
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

async fn create_sync_plan(
    app: &AppHandle,
    local_path: &str,
    remote_path: &str,
    hosting_id: &str,
    include_deletes: bool,
) -> Result<CodexPlan, String> {
    let local_entries = collect_local_sync_entries(local_path)?;
    let remote_entries = collect_remote_sync_entries(app, hosting_id, remote_path).await?;
    let remote_by_rel: std::collections::HashMap<String, SyncEntry> = remote_entries
        .into_iter()
        .map(|entry| (entry.rel_path.clone(), entry))
        .collect();
    let local_by_rel: std::collections::HashMap<String, SyncEntry> = local_entries
        .into_iter()
        .map(|entry| (entry.rel_path.clone(), entry))
        .collect();

    let mut actions = Vec::new();
    let mut risks = Vec::new();

    for local in local_by_rel.values() {
        if local.is_directory {
            continue;
        }
        let remote = remote_by_rel.get(&local.rel_path);
        let remote_target = join_remote_path(remote_path, &local.rel_path);
        let (action_type, reason) = match remote {
            None => (
                "uploadNewFile",
                "Local file does not exist remotely.".to_string(),
            ),
            Some(remote) if remote.size != local.size => (
                "uploadChangedFile",
                "Local and remote file sizes differ.".to_string(),
            ),
            Some(remote) => match (local.modified, remote.modified) {
                (Some(local_modified), Some(remote_modified))
                    if remote_modified >= local_modified =>
                {
                    (
                        "skipSameFile",
                        "Local and remote sizes match, and remote mtime is not older.".to_string(),
                    )
                }
                (Some(_), Some(_)) => (
                    "uploadChangedFile",
                    "Local file has a newer mtime than the remote file.".to_string(),
                ),
                _ => (
                    "uploadChangedFile",
                    "Sizes match, but modification times could not be verified safely.".to_string(),
                ),
            },
        };
        let destructive = matches!(action_type, "uploadChangedFile");
        if is_risky_deploy_path(&local.rel_path) {
            risks.push(format!(
                "Review risky local file before sync: {}",
                local.rel_path
            ));
        }
        actions.push(CodexPlanAction {
            action_type: action_type.to_string(),
            local_path: local.full_path.clone(),
            remote_path: Some(remote_target),
            size: Some(local.size),
            destructive,
            reason: Some(reason),
        });
    }

    for remote in remote_by_rel.values() {
        if remote.is_directory || local_by_rel.contains_key(&remote.rel_path) {
            continue;
        }
        let action_type = if include_deletes {
            "deleteRemoteFile"
        } else {
            "remoteOnlyFile"
        };
        if include_deletes {
            risks.push(format!(
                "Remote-only file will be deleted if this sync delete section is confirmed: {}",
                remote.rel_path
            ));
        }
        actions.push(CodexPlanAction {
            action_type: action_type.to_string(),
            local_path: None,
            remote_path: remote.full_path.clone(),
            size: Some(remote.size),
            destructive: include_deletes,
            reason: Some(if include_deletes {
                "Remote-only file selected for delete section.".to_string()
            } else {
                "Remote-only file; delete section is not enabled.".to_string()
            }),
        });
    }

    if include_deletes {
        risks
            .push("Remote delete actions require a separate destructive confirmation.".to_string());
    }

    Ok(CodexPlan {
        id: Uuid::new_v4().to_string(),
        kind: "syncLocalToRemote".to_string(),
        hosting_id: Some(hosting_id.to_string()),
        local_base_path: Some(local_path.to_string()),
        remote_base_path: Some(remote_path.to_string()),
        actions,
        risks,
        requires_confirmation: true,
    })
}

async fn create_remote_to_local_sync_plan(
    app: &AppHandle,
    local_path: &str,
    remote_path: &str,
    hosting_id: &str,
    include_deletes: bool,
) -> Result<CodexPlan, String> {
    let local_entries = collect_local_sync_entries(local_path)?;
    let remote_entries = collect_remote_sync_entries(app, hosting_id, remote_path).await?;
    let remote_by_rel: std::collections::HashMap<String, SyncEntry> = remote_entries
        .into_iter()
        .map(|entry| (entry.rel_path.clone(), entry))
        .collect();
    let local_by_rel: std::collections::HashMap<String, SyncEntry> = local_entries
        .into_iter()
        .map(|entry| (entry.rel_path.clone(), entry))
        .collect();

    let mut actions = Vec::new();
    let mut risks = Vec::new();

    for remote in remote_by_rel.values() {
        if remote.is_directory {
            continue;
        }
        let local = local_by_rel.get(&remote.rel_path);
        let local_target = safe_join_local_path(local_path, &remote.rel_path)?;
        let (action_type, reason) = match local {
            None => (
                "downloadNewFile",
                "Remote file does not exist locally.".to_string(),
            ),
            Some(local) if local.size != remote.size => (
                "downloadChangedFile",
                "Remote and local file sizes differ.".to_string(),
            ),
            Some(local) => match (remote.modified, local.modified) {
                (Some(remote_modified), Some(local_modified))
                    if local_modified >= remote_modified =>
                {
                    (
                        "skipSameFile",
                        "Remote and local sizes match, and local mtime is not older.".to_string(),
                    )
                }
                (Some(_), Some(_)) => (
                    "downloadChangedFile",
                    "Remote file has a newer mtime than the local file.".to_string(),
                ),
                _ => (
                    "downloadChangedFile",
                    "Sizes match, but modification times could not be verified safely.".to_string(),
                ),
            },
        };
        actions.push(CodexPlanAction {
            action_type: action_type.to_string(),
            local_path: Some(local_target),
            remote_path: remote.full_path.clone(),
            size: Some(remote.size),
            destructive: matches!(action_type, "downloadChangedFile"),
            reason: Some(reason),
        });
    }

    for local in local_by_rel.values() {
        if local.is_directory || remote_by_rel.contains_key(&local.rel_path) {
            continue;
        }
        let action_type = if include_deletes {
            "deleteLocalFile"
        } else {
            "localOnlyFile"
        };
        if include_deletes {
            risks.push(format!(
                "Local-only file will be deleted if this sync delete section is confirmed: {}",
                local.rel_path
            ));
        }
        actions.push(CodexPlanAction {
            action_type: action_type.to_string(),
            local_path: local.full_path.clone(),
            remote_path: None,
            size: Some(local.size),
            destructive: include_deletes,
            reason: Some(if include_deletes {
                "Local-only file selected for delete section.".to_string()
            } else {
                "Local-only file; delete section is not enabled.".to_string()
            }),
        });
    }

    if include_deletes {
        risks.push("Local delete actions require a separate destructive confirmation.".to_string());
    }

    Ok(CodexPlan {
        id: Uuid::new_v4().to_string(),
        kind: "syncRemoteToLocal".to_string(),
        hosting_id: Some(hosting_id.to_string()),
        local_base_path: Some(local_path.to_string()),
        remote_base_path: Some(remote_path.to_string()),
        actions,
        risks,
        requires_confirmation: true,
    })
}

fn collect_local_sync_entries(root: &str) -> Result<Vec<SyncEntry>, String> {
    let root_path = Path::new(root);
    if root_path.is_file() {
        let metadata = fs::metadata(root_path).map_err(|e| e.to_string())?;
        return Ok(vec![SyncEntry {
            rel_path: root_path
                .file_name()
                .map(|name| name.to_string_lossy().to_string())
                .unwrap_or_else(|| "file".to_string()),
            full_path: Some(root.to_string()),
            size: metadata.len(),
            is_directory: false,
            modified: modified_unix(metadata.modified().ok()),
        }]);
    }

    let mut entries = Vec::new();
    for entry in walkdir::WalkDir::new(root_path)
        .max_depth(MAX_SYNC_DEPTH + 1)
        .into_iter()
        .filter_map(Result::ok)
    {
        if entry.path() == root_path {
            continue;
        }
        let rel_path = entry
            .path()
            .strip_prefix(root_path)
            .map_err(|e| e.to_string())?
            .to_string_lossy()
            .replace('\\', "/");
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        entries.push(SyncEntry {
            rel_path,
            full_path: Some(entry.path().to_string_lossy().to_string()),
            size: if metadata.is_file() {
                metadata.len()
            } else {
                0
            },
            is_directory: metadata.is_dir(),
            modified: modified_unix(metadata.modified().ok()),
        });
        if entries.len() > MAX_SYNC_FILES {
            return Err(format!(
                "Sync plan exceeds the {} file limit",
                MAX_SYNC_FILES
            ));
        }
    }
    Ok(entries)
}

async fn collect_remote_sync_entries(
    app: &AppHandle,
    hosting_id: &str,
    remote_root: &str,
) -> Result<Vec<SyncEntry>, String> {
    let mut entries = Vec::new();
    collect_remote_sync_entries_inner(app, hosting_id, remote_root, "", 0, &mut entries).await?;
    Ok(entries)
}

async fn collect_remote_sync_entries_inner(
    app: &AppHandle,
    hosting_id: &str,
    remote_root: &str,
    rel_prefix: &str,
    depth: usize,
    entries: &mut Vec<SyncEntry>,
) -> Result<(), String> {
    if depth > MAX_SYNC_DEPTH {
        return Err(format!(
            "Remote sync traversal exceeds depth limit {}",
            MAX_SYNC_DEPTH
        ));
    }

    let current = if rel_prefix.is_empty() {
        remote_root.to_string()
    } else {
        join_remote_path(remote_root, rel_prefix)
    };

    for item in list_remote_metadata(app, hosting_id, &current).await? {
        let rel_path = if rel_prefix.is_empty() {
            item.name.clone()
        } else {
            format!("{}/{}", rel_prefix.trim_end_matches('/'), item.name)
        };
        let full_path = join_remote_path(remote_root, &rel_path);
        entries.push(SyncEntry {
            rel_path: rel_path.clone(),
            full_path: Some(full_path),
            size: item.size,
            is_directory: item.is_directory,
            modified: parse_modified_time(&item.modified),
        });
        if entries.len() > MAX_SYNC_FILES {
            return Err(format!(
                "Sync plan exceeds the {} file limit",
                MAX_SYNC_FILES
            ));
        }
        if item.is_directory {
            Box::pin(collect_remote_sync_entries_inner(
                app,
                hosting_id,
                remote_root,
                &rel_path,
                depth + 1,
                entries,
            ))
            .await?;
        }
    }
    Ok(())
}

fn join_remote_path(base: &str, rel_path: &str) -> String {
    format!(
        "{}/{}",
        base.trim_end_matches('/'),
        rel_path.trim_start_matches('/')
    )
}

fn safe_join_local_path(base: &str, rel_path: &str) -> Result<String, String> {
    let base = fs::canonicalize(base).map_err(|e| format!("Resolve local base failed: {}", e))?;
    let rel = Path::new(rel_path);
    if rel.is_absolute()
        || rel
            .components()
            .any(|component| matches!(component, std::path::Component::ParentDir))
    {
        return Err("Remote relative path cannot be mapped safely to a local path".to_string());
    }
    Ok(base.join(rel).to_string_lossy().to_string())
}

fn modified_unix(time: Option<SystemTime>) -> Option<i64> {
    time.and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|duration| duration.as_secs() as i64)
}

fn parse_modified_time(value: &str) -> Option<i64> {
    if value == "—" || value.trim().is_empty() {
        return None;
    }
    if let Ok(seconds) = value.parse::<i64>() {
        return Some(seconds);
    }
    if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(value) {
        return Some(dt.timestamp());
    }
    chrono::NaiveDateTime::parse_from_str(value, "%Y-%m-%d %H:%M")
        .ok()
        .map(|dt| dt.and_utc().timestamp())
}

fn is_risky_deploy_path(path: &str) -> bool {
    let lower = path.to_ascii_lowercase();
    lower.contains(".env")
        || lower.contains("node_modules")
        || lower.ends_with(".map")
        || lower.contains("/.git/")
        || lower.ends_with(".log")
}

fn emit_pending_plan(app: &AppHandle, plan: &CodexPlan) -> Result<(), String> {
    let report = change_report_from_plan(plan, false);
    app.emit(
        "loftp-codex-plan-pending",
        json!({
            "planId": plan.id,
            "kind": plan.kind,
            "hostingId": plan.hosting_id.as_deref(),
            "localBasePath": plan.local_base_path.as_deref(),
            "remoteBasePath": plan.remote_base_path.as_deref(),
            "report": report,
        }),
    )
    .map_err(|e| format!("Emit pending plan failed: {}", e))
}

fn emit_pending_build(app: &AppHandle, request: &CodexBuildRequest) -> Result<(), String> {
    app.emit(
        "loftp-codex-build-pending",
        json!({
            "requestId": request.id,
            "command": request.command,
            "workingDir": request.working_dir,
        }),
    )
    .map_err(|e| format!("Emit pending build failed: {}", e))
}

fn validate_build_command(command: &str) -> Result<(), String> {
    parse_build_command(command)
        .map(|_| ())
        .ok_or_else(|| "Build command is not on the LoFTP allowlist".to_string())
}

fn parse_build_command(command: &str) -> Option<(&'static str, Vec<&'static str>)> {
    match command.split_whitespace().collect::<Vec<_>>().as_slice() {
        ["npm", "run", "build"] => Some(("npm", vec!["run", "build"])),
        ["pnpm", "run", "build"] => Some(("pnpm", vec!["run", "build"])),
        ["yarn", "build"] => Some(("yarn", vec!["build"])),
        ["cargo", "build", "--release"] => Some(("cargo", vec!["build", "--release"])),
        ["composer", "install", "--no-dev", "--optimize-autoloader"] => Some((
            "composer",
            vec!["install", "--no-dev", "--optimize-autoloader"],
        )),
        ["python", "-m", "build"] => Some(("python", vec!["-m", "build"])),
        ["python3", "-m", "build"] => Some(("python3", vec!["-m", "build"])),
        _ => None,
    }
}

fn execute_build_request(request: &CodexBuildRequest) -> Result<Value, String> {
    let (program, args) = parse_build_command(&request.command)
        .ok_or_else(|| "Build command is not on the LoFTP allowlist".to_string())?;
    let output = Command::new(program)
        .args(args)
        .current_dir(&request.working_dir)
        .output()
        .map_err(|e| format!("Build command failed to start: {}", e))?;

    let stdout = redact_text(&truncate_bytes(&output.stdout, MAX_BUILD_LOG_BYTES));
    let stderr = redact_text(&truncate_bytes(&output.stderr, MAX_BUILD_LOG_BYTES));
    Ok(json!({
        "requestId": request.id,
        "command": request.command,
        "workingDir": request.working_dir,
        "status": if output.status.success() { "done" } else { "error" },
        "exitCode": output.status.code(),
        "stdout": stdout,
        "stderr": stderr,
    }))
}

fn truncate_bytes(bytes: &[u8], max_bytes: usize) -> String {
    let clipped = &bytes[..bytes.len().min(max_bytes)];
    let mut value = String::from_utf8_lossy(clipped).to_string();
    if bytes.len() > max_bytes {
        value.push_str("\n[truncated]");
    }
    value
}

async fn execute_plan(app: &AppHandle, plan: &CodexPlan) -> Result<Value, String> {
    let hosting_id = plan
        .hosting_id
        .as_deref()
        .ok_or_else(|| "Plan is missing hostingId".to_string())?;
    let mut executed = 0usize;
    let mut skipped = 0usize;
    let mut failed = 0usize;
    let mut errors = Vec::new();

    for action in &plan.actions {
        let result = match action.action_type.as_str() {
            "uploadFile" | "uploadNewFile" | "uploadChangedFile" => {
                let local_path = action
                    .local_path
                    .as_deref()
                    .ok_or_else(|| "Upload action is missing localPath".to_string());
                let remote_path = action
                    .remote_path
                    .as_deref()
                    .ok_or_else(|| "Upload action is missing remotePath".to_string());
                match (local_path, remote_path) {
                    (Ok(local_path), Ok(remote_path)) => {
                        remote_upload_file(app, hosting_id, local_path, remote_path).await
                    }
                    (Err(error), _) | (_, Err(error)) => Err(error),
                }
            }
            "downloadFile" | "downloadNewFile" | "downloadChangedFile" => {
                let remote_path = action
                    .remote_path
                    .as_deref()
                    .ok_or_else(|| "Download action is missing remotePath".to_string());
                let local_path = action
                    .local_path
                    .as_deref()
                    .ok_or_else(|| "Download action is missing localPath".to_string());
                match (remote_path, local_path) {
                    (Ok(remote_path), Ok(local_path)) => {
                        match resolve_allowed_local_path_for_write(app, local_path) {
                            Ok(local_path) => {
                                remote_download_file(app, hosting_id, remote_path, &local_path)
                                    .await
                            }
                            Err(error) => Err(error),
                        }
                    }
                    (Err(error), _) | (_, Err(error)) => Err(error),
                }
            }
            "deleteRemoteFile" => {
                let remote_path = action
                    .remote_path
                    .as_deref()
                    .ok_or_else(|| "Delete action is missing remotePath".to_string());
                match remote_path {
                    Ok(remote_path) => remote_delete_file(app, hosting_id, remote_path).await,
                    Err(error) => Err(error),
                }
            }
            "deleteLocalFile" => {
                let local_path = action
                    .local_path
                    .as_deref()
                    .ok_or_else(|| "Delete local action is missing localPath".to_string());
                match local_path {
                    Ok(local_path) => match resolve_allowed_local_path(app, local_path) {
                        Ok(local_path) => fs::remove_file(&local_path)
                            .map_err(|e| format!("Delete local file failed: {}", e)),
                        Err(error) => Err(error),
                    },
                    Err(error) => Err(error),
                }
            }
            "skipSameFile" | "remoteOnlyFile" | "localOnlyFile" => {
                skipped += 1;
                continue;
            }
            other => {
                skipped += 1;
                audit("loftp_execute_plan_action", false, Some(other));
                continue;
            }
        };

        match result {
            Ok(()) => {
                executed += 1;
                audit("loftp_execute_plan_action", true, None);
            }
            Err(error) => {
                failed += 1;
                audit("loftp_execute_plan_action", false, Some(&error));
                errors.push(json!({
                    "actionType": action.action_type,
                    "localPath": action.local_path.as_deref(),
                    "remotePath": action.remote_path.as_deref(),
                    "error": redact_text(&error),
                }));
            }
        }
    }

    Ok(json!({
        "planId": plan.id,
        "status": if failed == 0 { "done" } else { "partial" },
        "executed": true,
        "executedActions": executed,
        "skippedActions": skipped,
        "failedActions": failed,
        "errors": errors,
        "changeReport": change_report_from_plan(plan, true),
    }))
}

async fn remote_download_file(
    app: &AppHandle,
    hosting_id: &str,
    remote_path: &str,
    local_path: &str,
) -> Result<(), String> {
    if let Some(parent) = Path::new(local_path).parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Create local dir failed: {}", e))?;
    }

    match load_hosting_protocol(hosting_id)? {
        Protocol::Ftp | Protocol::Ftps => {
            let state = app.state::<FtpState>();
            let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
            let session = sessions
                .get_mut(hosting_id)
                .ok_or_else(|| "FTP profile is not connected in LoFTP".to_string())?;
            session.download_with_progress(remote_path, local_path, |_, _| {})
        }
        Protocol::Sftp => {
            let state = app.state::<SftpState>();
            let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
            let session = sessions
                .get_mut(hosting_id)
                .ok_or_else(|| "SFTP profile is not connected in LoFTP".to_string())?;
            session.download_with_progress(remote_path, local_path, |_, _| {})
        }
        Protocol::BunnyStorage => {
            let session = {
                let state = app.state::<BunnyStorageState>();
                let sessions = state.sessions.lock().map_err(|e| e.to_string())?;
                sessions
                    .get(hosting_id)
                    .cloned()
                    .ok_or_else(|| "Bunny Storage profile is not connected in LoFTP".to_string())?
            };
            session
                .download_file_with_progress(remote_path, local_path, |_, _| {}, None)
                .await
                .map(|_| ())
        }
    }
}

async fn remote_upload_file(
    app: &AppHandle,
    hosting_id: &str,
    local_path: &str,
    remote_path: &str,
) -> Result<(), String> {
    match load_hosting_protocol(hosting_id)? {
        Protocol::Ftp | Protocol::Ftps => {
            let state = app.state::<FtpState>();
            let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
            let session = sessions
                .get_mut(hosting_id)
                .ok_or_else(|| "FTP profile is not connected in LoFTP".to_string())?;
            if let Some(parent) = remote_parent_path(remote_path) {
                session.mkdir_p(&parent)?;
            }
            session.upload_with_progress(local_path, remote_path, |_, _| {})
        }
        Protocol::Sftp => {
            let state = app.state::<SftpState>();
            let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
            let session = sessions
                .get_mut(hosting_id)
                .ok_or_else(|| "SFTP profile is not connected in LoFTP".to_string())?;
            if let Some(parent) = remote_parent_path(remote_path) {
                session.mkdir_p(&parent)?;
            }
            session.upload_with_progress(local_path, remote_path, |_, _| {})
        }
        Protocol::BunnyStorage => {
            let session = {
                let state = app.state::<BunnyStorageState>();
                let sessions = state.sessions.lock().map_err(|e| e.to_string())?;
                sessions
                    .get(hosting_id)
                    .cloned()
                    .ok_or_else(|| "Bunny Storage profile is not connected in LoFTP".to_string())?
            };
            session
                .upload_file(local_path, remote_path)
                .await
                .map(|_| ())
        }
    }
}

async fn remote_delete_file(
    app: &AppHandle,
    hosting_id: &str,
    remote_path: &str,
) -> Result<(), String> {
    match load_hosting_protocol(hosting_id)? {
        Protocol::Ftp | Protocol::Ftps => {
            let state = app.state::<FtpState>();
            let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
            let session = sessions
                .get_mut(hosting_id)
                .ok_or_else(|| "FTP profile is not connected in LoFTP".to_string())?;
            session.delete_file(remote_path)
        }
        Protocol::Sftp => {
            let state = app.state::<SftpState>();
            let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
            let session = sessions
                .get_mut(hosting_id)
                .ok_or_else(|| "SFTP profile is not connected in LoFTP".to_string())?;
            session.delete_file(remote_path)
        }
        Protocol::BunnyStorage => {
            let session = {
                let state = app.state::<BunnyStorageState>();
                let sessions = state.sessions.lock().map_err(|e| e.to_string())?;
                sessions
                    .get(hosting_id)
                    .cloned()
                    .ok_or_else(|| "Bunny Storage profile is not connected in LoFTP".to_string())?
            };
            session.delete(remote_path).await
        }
    }
}

fn load_hosting_protocol(hosting_id: &str) -> Result<Protocol, String> {
    config_store::load_hostings()
        .into_iter()
        .find(|hosting| hosting.id == hosting_id)
        .map(|hosting| hosting.protocol)
        .ok_or_else(|| "Hosting profile not found".to_string())
}

fn remote_parent_path(path: &str) -> Option<String> {
    let trimmed = path.trim_end_matches('/');
    let (parent, _) = trimmed.rsplit_once('/')?;
    if parent.is_empty() {
        None
    } else {
        Some(parent.to_string())
    }
}

fn change_report_from_plan(plan: &CodexPlan, executed: bool) -> Value {
    let mut counts: std::collections::BTreeMap<String, usize> = std::collections::BTreeMap::new();
    let mut total_bytes = 0u64;
    let mut destructive_actions = 0usize;

    for action in &plan.actions {
        *counts.entry(action.action_type.clone()).or_default() += 1;
        total_bytes += action.size.unwrap_or(0);
        if action.destructive {
            destructive_actions += 1;
        }
    }

    json!({
        "planId": plan.id,
        "kind": plan.kind,
        "executed": executed,
        "actionCounts": counts,
        "totalActions": plan.actions.len(),
        "totalBytes": total_bytes,
        "destructiveActions": destructive_actions,
        "risks": plan.risks.clone(),
        "rollbackRecommendation": rollback_recommendation(plan),
    })
}

fn change_report_from_transfer(
    transfer: Option<crate::models::transfer::TransferProgress>,
) -> Value {
    match transfer {
        Some(transfer) => {
            let rollback = match &transfer.status {
                TransferStatus::Done => {
                    "Review uploaded paths and keep a backup before deleting remote files."
                }
                TransferStatus::Error | TransferStatus::Cancelled => {
                    "Retry only failed or incomplete files after refreshing both panels."
                }
                _ => "Wait for transfer completion before preparing rollback steps.",
            };
            json!({
                "transferId": transfer.transfer_id,
                "fileName": transfer.file_name,
                "status": transfer.status,
                "bytesTransferred": transfer.bytes_transferred,
                "totalBytes": transfer.total_bytes,
                "completedFiles": transfer.completed_files,
                "totalFiles": transfer.total_files,
                "rollbackRecommendation": rollback
            })
        }
        None => json!({ "error": "Transfer not found" }),
    }
}

fn rollback_recommendation(plan: &CodexPlan) -> String {
    if plan
        .actions
        .iter()
        .any(|action| action.action_type == "deleteRemoteFile")
    {
        "Download or snapshot remote-only files before executing the delete section.".to_string()
    } else if plan
        .actions
        .iter()
        .any(|action| action.action_type == "deleteLocalFile")
    {
        "Copy local-only files to a backup before executing the delete section.".to_string()
    } else if plan.actions.iter().any(|action| action.destructive) {
        "Keep a remote backup before overwriting changed files.".to_string()
    } else {
        "No destructive changes are planned; rollback is likely limited to removing newly uploaded files.".to_string()
    }
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
