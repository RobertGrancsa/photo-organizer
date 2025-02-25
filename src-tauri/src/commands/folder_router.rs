use std::sync::Mutex;

mod commands;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
pub fn get_folders(context: tauri::State<Mutex<RuntimeContext>>) -> String {
    String::from("Hello You've been greeted from Rust!")
}



