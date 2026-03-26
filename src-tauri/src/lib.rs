mod commands;
mod models;
mod services;

use commands::ftp::FtpState;
use commands::sftp::SftpState;
use commands::updater::PendingUpdateState;
use models::transfer::CancellationState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(FtpState::new())
        .manage(SftpState::new())
        .manage(PendingUpdateState::new())
        .manage(CancellationState::new())
        .invoke_handler(tauri::generate_handler![
            // Filesystem
            commands::filesystem::fs_list,
            commands::filesystem::fs_get_home,
            commands::filesystem::fs_mkdir,
            commands::filesystem::fs_delete,
            commands::filesystem::fs_rename,
            commands::filesystem::fs_copy,
            commands::filesystem::fs_copy_dir,
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
