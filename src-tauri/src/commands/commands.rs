use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;
use uuid::Uuid;

use crate::commands::types::PhotoData;
use crate::task_queue::tasks::Task;
use crate::task_queue::TaskQueue;
use db_service::db::DbPool;
use db_service::schema::{Directory, NewDirectory};
use db_service::services::directory::{get_directories, get_directory_id_by_name, insert_directory};
use db_service::services::photo::{get_photos_filtered, insert_photos_from_directory};
use db_service::services::tags::get_unique_filters;

#[tauri::command]
pub fn get_folders(pool: State<DbPool>) -> Result<Vec<Directory>, String> {
    let conn = &mut pool.get().map_err(|err| err.to_string())?;

    get_directories(conn).map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn add_folder(
    pool: State<'_, DbPool>,
    state: State<'_, Arc<Mutex<TaskQueue>>>,
    path: &str,
) -> Result<Directory, String> {
    let conn = &mut pool.get().map_err(|e| e.to_string())?;

    let new_dir = NewDirectory {
        id: Uuid::new_v4(),
        path: String::from(path),
        photo_count: 0,
    };

    let dir_record = insert_directory(conn, new_dir).map_err(|e| e.to_string())?;

    insert_photos_from_directory(conn, &dir_record).map_err(|e| e.to_string())?;

    let queue = state.lock().await;

    queue.add_task(Task::CreatePreviewForPhotos(dir_record.clone()));

    Ok(dir_record)
}

#[tauri::command]
pub fn get_photos_from_path(
    pool: State<DbPool>,
    path: &str,
    tag_filters: Vec<String>,
) -> Result<PhotoData, String> {
    let conn = &mut pool.get().map_err(|e| e.to_string())?;

    let path_uuid: Option<Uuid> = get_directory_id_by_name(conn, path);

    // If no UUID is found, return an empty list
    let path_uuid = match path_uuid {
        Some(uuid) => uuid,
        None => {
            tracing::error!("No UUID found for path: {}", path);
            return Ok(PhotoData {
                photos: vec![],
                tags: vec![],
            });
        }
    };

    Ok(PhotoData {
        photos: get_photos_filtered(conn, path_uuid, tag_filters).map_err(|e| e.to_string())?,
        tags: get_unique_filters(conn, path_uuid).map_err(|e| e.to_string())?,
    })
}
