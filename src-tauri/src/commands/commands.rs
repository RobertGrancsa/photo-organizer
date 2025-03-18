use db_service::db::DbPool;
use db_service::schema::schema::directories::dsl::directories;
use db_service::schema::{Directory, NewDirectory, Photo};
use db_service::services::photo::{get_photos_from_directory, insert_photos_from_directory};
use std::sync::Arc;

use crate::task_queue::tasks::Task;
use crate::task_queue::TaskQueue;
use db_service::services::directory::get_directories;
use diesel::prelude::*;
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
    use db_service::schema::schema::directories;
    let conn = &mut pool.get().map_err(|e| e.to_string())?;

    let new_dir = NewDirectory {
        id: Uuid::new_v4(),
        path: String::from(path),
        photo_count: 0,
    };

    let dir_record = diesel::insert_into(directories::table)
        .values(&new_dir)
        .returning(Directory::as_returning())
        .get_result(conn)
        .expect("Error saving dir");

    let photo_count = insert_photos_from_directory(conn, &dir_record).map_err(|e| e.to_string())?;
    let queue = state.lock().await;

    queue.add_task(Task::CreatePreviewForPhotos(dir_record.clone()));

    Ok(dir_record)
}

#[tauri::command]
pub fn get_photos_from_path(pool: State<DbPool>, path: &str) -> Vec<Photo> {
    use db_service::schema::schema::directories;
    let conn = &mut pool.get().expect("Should be connected to the db");

    // Get the UUID for the given directory path
    let path_uuid: Option<Uuid> = directories
        .filter(directories::path.eq(path))
        .select(directories::id)
        .first(conn)
        .ok();

    // If no UUID is found, return an empty list
    let path_uuid = match path_uuid {
        Some(uuid) => uuid,
        None => {
            eprintln!("No UUID found for path: {}", path);
            return vec![];
        }
    };

    get_photos_from_directory(conn, path_uuid)
}
