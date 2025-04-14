use crate::task_queue::tasks::Task;
use crate::task_queue::TaskQueue;
use crate::APP_NAME;
use db_service::db::DbPool;
use db_service::schema::{Directory, NewDirectory};
use db_service::services::directory::{
    delete_directory_from_database, get_directories, get_directory_id_by_name, insert_directory,
};
use db_service::services::photo::insert_photos_from_directory;
use std::fs;
use std::path::Path;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;
use uuid::Uuid;

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
pub fn delete_folder(pool: State<'_, DbPool>, path: &str) -> Result<(), String> {
    let conn = &mut pool.get().map_err(|e| e.to_string())?;

    let path_uuid: Option<Uuid> = get_directory_id_by_name(conn, path);

    let path_uuid = match path_uuid {
        Some(uuid) => uuid,
        None => {
            tracing::error!("No UUID found for path: {}", path);
            return Ok(());
        }
    };

    let delete_status = delete_directory_from_database(conn, &path_uuid);

    if let Err(e) = delete_status {
        return Err(e.to_string());
    }

    let local_photo_path = dirs::data_local_dir()
        .unwrap_or_else(|| Path::new(".").to_path_buf())
        .join(APP_NAME)
        .join(path_uuid.to_string());

    if local_photo_path.exists() {
        fs::remove_dir_all(&local_photo_path).map_err(|e| {
            format!(
                "Error deleting directory at path {:?}: {}",
                local_photo_path, e
            )
        })?;
    }

    Ok(())
}
