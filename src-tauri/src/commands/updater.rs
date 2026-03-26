use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_updater::{Update, UpdaterExt};

const DEFAULT_UPDATER_ENDPOINT: &str = "https://downloads.loftp.mylocalio.com/stable/latest.json";
const CONFIGURED_UPDATER_PUBLIC_KEY: &str = "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEZDOTQ2MUE1NDlDQjI1MjAKUldRZ0pjdEpwV0dVL0FldFppQ3dHajhzRm5tQ3dMUStzKzFYOVYyVTU4WmpNcjdtV0xaRXZ3UzgK";

pub struct PendingUpdateState {
    inner: Mutex<Option<Update>>,
}

impl PendingUpdateState {
    pub fn new() -> Self {
        Self {
            inner: Mutex::new(None),
        }
    }
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdaterStatus {
    configured: bool,
    current_version: String,
    endpoint: String,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AvailableUpdate {
    version: String,
    current_version: String,
    date: Option<String>,
    body: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(tag = "event", content = "data")]
#[serde(rename_all = "camelCase")]
enum InstallEvent {
    Started { content_length: Option<u64> },
    Progress { chunk_length: usize },
    Finished,
}

fn configured_endpoint() -> String {
    option_env!("LOFTP_UPDATER_ENDPOINT")
        .map(str::trim)
        .filter(|v| !v.is_empty())
        .unwrap_or(DEFAULT_UPDATER_ENDPOINT)
        .to_string()
}

#[tauri::command]
pub fn updater_get_status() -> UpdaterStatus {
    UpdaterStatus {
        configured: true,
        current_version: env!("CARGO_PKG_VERSION").to_string(),
        endpoint: configured_endpoint(),
    }
}

#[tauri::command]
pub async fn updater_check(
    app: AppHandle,
    state: State<'_, PendingUpdateState>,
) -> Result<Option<AvailableUpdate>, String> {
    let endpoint = configured_endpoint();
    let endpoint =
        reqwest::Url::parse(&endpoint).map_err(|e| format!("Updater endpoint is invalid: {e}"))?;
    let update = app
        .updater_builder()
        .pubkey(CONFIGURED_UPDATER_PUBLIC_KEY)
        .endpoints(vec![endpoint])
        .map_err(|e| format!("Updater endpoint configuration failed: {e}"))?
        .build()
        .map_err(|e| format!("Updater build failed: {e}"))?
        .check()
        .await
        .map_err(|e| format!("Update check failed: {e}"))?;

    let mut pending = state.inner.lock().map_err(|e| e.to_string())?;

    match update {
        Some(update) => {
            let payload = AvailableUpdate {
                version: update.version.clone(),
                current_version: env!("CARGO_PKG_VERSION").to_string(),
                date: update.date.map(|d| d.to_string()),
                body: update.body.clone(),
            };
            *pending = Some(update);
            Ok(Some(payload))
        }
        None => {
            *pending = None;
            Ok(None)
        }
    }
}

#[tauri::command]
pub async fn updater_install_pending(
    app: AppHandle,
    state: State<'_, PendingUpdateState>,
) -> Result<(), String> {
    let update = {
        let mut pending = state.inner.lock().map_err(|e| e.to_string())?;
        pending
            .take()
            .ok_or("Nejdřív je potřeba zkontrolovat dostupné aktualizace.")?
    };

    let mut started = false;
    update
        .download_and_install(
            |chunk_length, content_length| {
                if !started {
                    let _ = app.emit(
                        "updater-install-event",
                        InstallEvent::Started { content_length },
                    );
                    started = true;
                }

                let _ = app.emit(
                    "updater-install-event",
                    InstallEvent::Progress { chunk_length },
                );
            },
            || {
                let _ = app.emit("updater-install-event", InstallEvent::Finished);
            },
        )
        .await
        .map_err(|e| format!("Update install failed: {e}"))?;

    app.restart();
}
