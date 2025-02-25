mod db;
pub mod commands;
pub mod schema;
pub mod services;

use crate::commands::commands::{get_folders, add_folder, get_photos_from_path};
use crate::db::init_pool;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let pool = init_pool();

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(pool)
        .invoke_handler(tauri::generate_handler![get_folders])
        .invoke_handler(tauri::generate_handler![add_folder])
        .invoke_handler(tauri::generate_handler![get_photos_from_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
