mod commands;
mod models;
mod services;

use commands::bunny_storage::BunnyStorageState;
use commands::codex::CodexBridgeState;
use commands::ftp::FtpState;
use commands::sftp::SftpState;
use commands::updater::PendingUpdateState;
use models::transfer::{CancellationState, TransferRegistry};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(FtpState::new())
        .manage(BunnyStorageState::new())
        .manage(CodexBridgeState::new())
        .manage(SftpState::new())
        .manage(PendingUpdateState::new())
        .manage(CancellationState::new())
        .manage(TransferRegistry::new())
        .setup(|app| {
            commands::codex::codex_start_bridge_from_saved_settings(app.handle().clone());
            Ok(())
        })
        .on_menu_event(|app, event| {
            commands::ui::handle_menu_event(app, event.id().as_ref());
        })
        .invoke_handler(tauri::generate_handler![
            // Filesystem
            commands::filesystem::fs_list,
            commands::filesystem::fs_get_home,
            commands::filesystem::fs_mkdir,
            commands::filesystem::fs_delete,
            commands::filesystem::fs_is_dir,
            commands::filesystem::fs_rename,
            commands::filesystem::fs_copy,
            commands::filesystem::fs_copy_dir,
            commands::filesystem::fs_chmod,
            commands::filesystem::fs_set_modified,
            commands::filesystem::fs_checksum,
            commands::filesystem::fs_split_file,
            commands::filesystem::fs_combine_files,
            commands::filesystem::fs_list_volumes,
            commands::filesystem::fs_list_cloud_storages,
            // FTP
            commands::ftp::ftp_connect,
            commands::ftp::ftp_test_connection,
            commands::ftp::ftp_list,
            commands::ftp::ftp_upload,
            commands::ftp::ftp_download,
            commands::ftp::ftp_upload_dir,
            commands::ftp::ftp_download_dir,
            commands::ftp::ftp_mkdir,
            commands::ftp::ftp_delete,
            commands::ftp::ftp_rename,
            commands::ftp::ftp_disconnect,
            commands::ftp::cancel_transfer,
            // Bunny Storage
            commands::bunny_storage::bunny_storage_connect,
            commands::bunny_storage::bunny_storage_test_connection,
            commands::bunny_storage::bunny_storage_list,
            commands::bunny_storage::bunny_storage_upload,
            commands::bunny_storage::bunny_storage_download,
            commands::bunny_storage::bunny_storage_upload_dir,
            commands::bunny_storage::bunny_storage_download_dir,
            commands::bunny_storage::bunny_storage_mkdir,
            commands::bunny_storage::bunny_storage_delete,
            commands::bunny_storage::bunny_storage_rename,
            commands::bunny_storage::bunny_storage_disconnect,
            // SFTP
            commands::sftp::sftp_connect,
            commands::sftp::sftp_test_connection,
            commands::sftp::sftp_list,
            commands::sftp::sftp_upload,
            commands::sftp::sftp_download,
            commands::sftp::sftp_upload_dir,
            commands::sftp::sftp_download_dir,
            commands::sftp::sftp_mkdir,
            commands::sftp::sftp_delete,
            commands::sftp::sftp_rename,
            commands::sftp::sftp_disconnect,
            // Hosting
            commands::hosting::hosting_list,
            commands::hosting::hosting_save,
            commands::hosting::hosting_delete,
            // License
            commands::license::license_activate,
            commands::license::license_check,
            commands::license::license_get_status,
            // Purchase
            commands::purchase::purchase_create_checkout,
            // Updater
            commands::updater::updater_get_status,
            commands::updater::updater_check,
            commands::updater::updater_install_pending,
            // Archive
            commands::archive::archive_list,
            commands::archive::archive_list_dir,
            commands::archive::archive_read_text,
            commands::archive::archive_read_hex,
            commands::archive::archive_extract,
            commands::archive::archive_create,
            // Search
            commands::search::fs_search,
            // Viewer
            commands::viewer::fs_read_text,
            commands::viewer::fs_read_hex,
            commands::viewer::fs_write_text,
            // AI
            commands::ai::ai_get_settings,
            commands::ai::ai_save_settings,
            commands::ai::ai_delete_api_key,
            commands::ai::ai_test_settings,
            commands::ai::ai_run_prompt,
            // Codex
            commands::codex::codex_get_bridge_settings,
            commands::codex::codex_save_bridge_settings,
            commands::codex::codex_list_hostings,
            commands::codex::codex_update_active_context,
            commands::codex::codex_execute_pending_plan,
            commands::codex::codex_execute_pending_build,
            // UI
            commands::ui::ui_show_context_menu,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
