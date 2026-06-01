use serde::{Deserialize, Serialize};
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    AppHandle, Emitter, WebviewWindow,
};

const CONTEXT_MENU_PREFIX: &str = "loftp-context-menu:";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeContextMenuPayload {
    pub id: String,
    pub items: Vec<NativeContextMenuItem>,
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeContextMenuItem {
    pub action: String,
    pub label: String,
    pub shortcut: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ContextMenuActionPayload {
    pub id: String,
    pub action: String,
}

#[tauri::command]
pub fn ui_show_context_menu(
    window: WebviewWindow,
    app: AppHandle,
    payload: NativeContextMenuPayload,
) -> Result<(), String> {
    let menu = Menu::new(&app).map_err(|error| error.to_string())?;

    for (index, item) in payload.items.iter().enumerate() {
        if index > 0 && should_insert_separator(&payload.items[index - 1], item) {
            let separator = PredefinedMenuItem::separator(&app).map_err(|error| error.to_string())?;
            menu.append(&separator).map_err(|error| error.to_string())?;
        }

        let menu_item = MenuItem::with_id(
            &app,
            format!("{}{}:{}", CONTEXT_MENU_PREFIX, payload.id, item.action),
            item.label.clone(),
            true,
            item.shortcut.as_deref(),
        )
        .map_err(|error| error.to_string())?;
        menu.append(&menu_item).map_err(|error| error.to_string())?;
    }

    window
        .popup_menu_at(&menu, tauri::LogicalPosition::new(payload.x, payload.y))
        .map_err(|error| error.to_string())
}

pub fn handle_menu_event(app: &AppHandle, event_id: &str) {
    let Some(raw) = event_id.strip_prefix(CONTEXT_MENU_PREFIX) else {
        return;
    };
    let Some((id, action)) = raw.split_once(':') else {
        return;
    };

    let _ = app.emit(
        "loftp-context-menu-action",
        ContextMenuActionPayload {
            id: id.to_string(),
            action: action.to_string(),
        },
    );
}

fn should_insert_separator(previous: &NativeContextMenuItem, current: &NativeContextMenuItem) -> bool {
    context_menu_group(&previous.action) != context_menu_group(&current.action)
}

fn context_menu_group(action: &str) -> u8 {
    match action {
        "copyPath" | "copyName" | "copyBaseName" | "copyFiles" | "pasteFiles" => 0,
        "openInFinder" | "openInVSCode" | "openNatively" | "openWith" => 1,
        "aiExplainFile" | "codexExplainFile" => 2,
        "openAsArchive" | "openArchive" | "createArchive" | "extractHere" | "extractTo" => 3,
        "copyTo" | "moveTo" | "newFile" | "newFolder" | "refresh" | "search" => 4,
        "selectAll" | "deselectAll" | "invertSelection" | "selectByExtension" | "selectByPattern" | "compareFolders" => 5,
        "properties" | "chmod" | "changeDate" | "calculateChecksum" | "batchRename" | "splitFile" | "combineFiles" => 6,
        "rename" | "delete" => 7,
        _ => 6,
    }
}
