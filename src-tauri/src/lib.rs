mod db;
pub mod commands;

use crate::db::establish_connection;
use crate::commands::get_folder;

use std::sync::Mutex;
use diesel::PgConnection;

pub struct RuntimeContext {
    db: PgConnection
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let context = RuntimeContext {
        db: establish_connection()
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(context))
        .invoke_handler(tauri::generate_handler![get_folder])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
