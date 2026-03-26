use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferProgress {
    pub transfer_id: String,
    pub file_name: String,
    pub progress: u8,
    pub status: TransferStatus,
    pub bytes_transferred: u64,
    pub total_bytes: u64,
    pub current_file_name: Option<String>,
    pub current_file_bytes_transferred: Option<u64>,
    pub current_file_total_bytes: Option<u64>,
    pub completed_files: Option<u64>,
    pub total_files: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TransferStatus {
    Pending,
    Transferring,
    Done,
    Error,
    Cancelled,
}

/// Shared cancellation tokens for active transfers
pub struct CancellationState {
    tokens: Mutex<HashMap<String, Arc<AtomicBool>>>,
}

impl CancellationState {
    pub fn new() -> Self {
        Self {
            tokens: Mutex::new(HashMap::new()),
        }
    }

    /// Register a new transfer and return its cancellation token
    pub fn register(&self, transfer_id: &str) -> Arc<AtomicBool> {
        let token = Arc::new(AtomicBool::new(false));
        if let Ok(mut tokens) = self.tokens.lock() {
            tokens.insert(transfer_id.to_string(), token.clone());
        }
        token
    }

    /// Signal cancellation for a transfer
    pub fn cancel(&self, transfer_id: &str) -> bool {
        if let Ok(tokens) = self.tokens.lock() {
            if let Some(token) = tokens.get(transfer_id) {
                token.store(true, Ordering::Relaxed);
                return true;
            }
        }
        false
    }

    /// Remove a completed/cancelled transfer token
    pub fn remove(&self, transfer_id: &str) {
        if let Ok(mut tokens) = self.tokens.lock() {
            tokens.remove(transfer_id);
        }
    }
}

/// Check if a transfer was cancelled
pub fn is_cancelled(token: &AtomicBool) -> bool {
    token.load(Ordering::Relaxed)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferOptions {
    pub mode: String,      // "binary" | "ascii" | "auto"
    pub overwrite: String, // "overwrite" | "skip" | "rename" | "ask" | "overwrite-older"
    pub resume: bool,
    pub preserve_timestamps: bool,
    pub preserve_permissions: bool,
    pub follow_symlinks: bool,
    pub create_dirs: bool,
    pub verify_after_transfer: bool,
}
