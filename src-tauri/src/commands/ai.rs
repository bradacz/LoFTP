use crate::services::credential_store;
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{fs, path::PathBuf, time::Duration};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiSettings {
    pub provider: String,
    pub model: String,
    pub base_url: Option<String>,
    pub api_key_configured: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveAiSettings {
    pub provider: String,
    pub model: String,
    pub base_url: Option<String>,
    pub api_key: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiPromptRequest {
    pub task: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiPromptResponse {
    pub output: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredAiSettings {
    provider: String,
    model: String,
    base_url: Option<String>,
}

fn app_data_dir() -> PathBuf {
    let base = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    let dir = base.join("com.loftp.desktop");
    fs::create_dir_all(&dir).ok();
    dir
}

fn ai_settings_path() -> PathBuf {
    app_data_dir().join("ai_settings.json")
}

fn default_settings() -> StoredAiSettings {
    StoredAiSettings {
        provider: "openai".to_string(),
        model: String::new(),
        base_url: None,
    }
}

fn normalize_provider(provider: &str) -> String {
    provider
        .trim()
        .to_lowercase()
        .replace(' ', "-")
        .replace("_", "-")
}

fn load_stored_settings() -> StoredAiSettings {
    fs::read_to_string(ai_settings_path())
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_else(default_settings)
}

fn save_stored_settings(settings: &StoredAiSettings) -> Result<(), String> {
    let raw = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(ai_settings_path(), raw).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn ai_get_settings() -> Result<AiSettings, String> {
    let stored = load_stored_settings();
    Ok(AiSettings {
        api_key_configured: credential_store::load_ai_api_key(&stored.provider).is_some(),
        provider: stored.provider,
        model: stored.model,
        base_url: stored.base_url,
    })
}

#[tauri::command]
pub fn ai_save_settings(settings: SaveAiSettings) -> Result<AiSettings, String> {
    let provider = normalize_provider(&settings.provider);
    let stored = StoredAiSettings {
        provider: provider.clone(),
        model: settings.model.trim().to_string(),
        base_url: settings
            .base_url
            .and_then(|value| {
                let trimmed = value.trim().trim_end_matches('/').to_string();
                if trimmed.is_empty() { None } else { Some(trimmed) }
            }),
    };

    if let Some(api_key) = settings.api_key {
        let trimmed = api_key.trim();
        if !trimmed.is_empty() {
            credential_store::store_ai_api_key(&provider, trimmed)?;
        }
    }

    save_stored_settings(&stored)?;
    ai_get_settings()
}

#[tauri::command]
pub fn ai_delete_api_key(provider: String) -> Result<(), String> {
    credential_store::delete_ai_api_key(&normalize_provider(&provider))
}

#[tauri::command]
pub async fn ai_test_settings() -> Result<AiPromptResponse, String> {
    ai_run_prompt(AiPromptRequest {
        task: "test".to_string(),
        content: "Reply with OK only.".to_string(),
    })
    .await
}

#[tauri::command]
pub async fn ai_run_prompt(request: AiPromptRequest) -> Result<AiPromptResponse, String> {
    let settings = load_stored_settings();
    let provider = normalize_provider(&settings.provider);
    let api_key = credential_store::load_ai_api_key(&provider)
        .ok_or_else(|| "AI API key is not configured.".to_string())?;

    if settings.model.trim().is_empty() {
        return Err("AI model is not configured.".to_string());
    }

    let prompt = format!(
        "You are LoFTP assistant. Keep the answer practical and concise.\nTask: {}\n\nContent:\n{}",
        request.task, request.content
    );

    let output = match provider.as_str() {
        "anthropic" | "claude" => call_anthropic(&settings, &api_key, &prompt).await?,
        "gemini" | "google-gemini" => call_gemini(&settings, &api_key, &prompt).await?,
        "openai" | "perplexity" | "openai-compatible-api" | "opencode-api" | "nvidia" => {
            call_openai_compatible(&settings, &api_key, &prompt).await?
        }
        _ => call_openai_compatible(&settings, &api_key, &prompt).await?,
    };

    Ok(AiPromptResponse { output })
}

async fn call_openai_compatible(
    settings: &StoredAiSettings,
    api_key: &str,
    prompt: &str,
) -> Result<String, String> {
    let provider = normalize_provider(&settings.provider);
    let base_url = settings.base_url.clone().unwrap_or_else(|| match provider.as_str() {
        "perplexity" => "https://api.perplexity.ai".to_string(),
        "nvidia" => "https://integrate.api.nvidia.com/v1".to_string(),
        _ => "https://api.openai.com/v1".to_string(),
    });
    let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(&format!("Bearer {}", api_key)).map_err(|e| e.to_string())?,
    );

    let body = json!({
        "model": settings.model,
        "messages": [
            { "role": "user", "content": prompt }
        ],
        "temperature": 0.2
    });

    let value = post_json(&url, headers, body).await?;
    value["choices"][0]["message"]["content"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "AI response did not contain message content.".to_string())
}

async fn call_anthropic(
    settings: &StoredAiSettings,
    api_key: &str,
    prompt: &str,
) -> Result<String, String> {
    let base_url = settings
        .base_url
        .clone()
        .unwrap_or_else(|| "https://api.anthropic.com/v1".to_string());
    let url = format!("{}/messages", base_url.trim_end_matches('/'));

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert("x-api-key", HeaderValue::from_str(api_key).map_err(|e| e.to_string())?);
    headers.insert("anthropic-version", HeaderValue::from_static("2023-06-01"));

    let body = json!({
        "model": settings.model,
        "max_tokens": 1200,
        "messages": [
            { "role": "user", "content": prompt }
        ]
    });

    let value = post_json(&url, headers, body).await?;
    value["content"][0]["text"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "AI response did not contain text content.".to_string())
}

async fn call_gemini(
    settings: &StoredAiSettings,
    api_key: &str,
    prompt: &str,
) -> Result<String, String> {
    let base_url = settings
        .base_url
        .clone()
        .unwrap_or_else(|| "https://generativelanguage.googleapis.com/v1beta".to_string());
    let url = format!(
        "{}/models/{}:generateContent?key={}",
        base_url.trim_end_matches('/'),
        settings.model,
        api_key
    );

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    let body = json!({
        "contents": [
            {
                "parts": [
                    { "text": prompt }
                ]
            }
        ]
    });

    let value = post_json(&url, headers, body).await?;
    value["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "AI response did not contain Gemini text content.".to_string())
}

async fn post_json(url: &str, headers: HeaderMap, body: Value) -> Result<Value, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(45))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .post(url)
        .headers(headers)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("AI request failed: {}", e))?;

    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        return Err(format!("AI request failed with {}: {}", status, text));
    }

    serde_json::from_str(&text).map_err(|e| format!("AI response parse failed: {}", e))
}
