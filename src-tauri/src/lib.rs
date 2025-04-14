pub mod commands;
pub mod task_queue;

use crate::commands::directories::{add_folder, get_folders, delete_folder};
use crate::commands::faces::get_face_clusters;
use crate::commands::photos::get_photos_from_path;
use crate::task_queue::tasks::pre_initialization::restart_background_processing;
use crate::task_queue::tasks::worker::task_worker;
use crate::task_queue::TaskQueue;
use db_service::db::init_pool;
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

pub const APP_NAME: &str = "photo-organizer";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .setup(|app| {
            let pool = init_pool();

            let (task_queue, task_receiver) = TaskQueue::new();
            let queue_state = Arc::new(Mutex::new(task_queue));

            let worker_db_pool = pool.clone();
            let q = queue_state.clone();
            let app_handle = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                let conn = &mut worker_db_pool
                    .get()
                    .map_err(|err| err.to_string())
                    .expect("We should have DB connection");

                if let Err(err) = restart_background_processing(conn, q).await {
                    tracing::error!("Error while restarting image preview gen: {:?}", err);
                }
                task_worker(task_receiver, worker_db_pool, app_handle).await;
            });

            app.manage(pool);
            app.manage(queue_state);

            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            add_folder,
            delete_folder,
            get_folders,
            get_photos_from_path,
            get_face_clusters,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
