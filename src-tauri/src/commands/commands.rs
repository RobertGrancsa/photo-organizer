use crate::db::DbPool;
use crate::schema::schema::directories::dsl::directories;
use crate::schema::{Directory, NewDirectory, Photo};
use crate::services::photo::{get_photos_from_directory, insert_photos_from_directory};
use std::sync::Arc;

use crate::task_queue::tasks::Task;
use crate::task_queue::TaskQueue;
use diesel::prelude::*;
use tauri::State;
use tokio::sync::Mutex;
use uuid::Uuid;

#[tauri::command]
pub fn get_folders(pool: State<DbPool>) -> Vec<Directory> {
    let conn = &mut pool.get().expect("Should be connected to the db");

    directories
        .select(Directory::as_select())
        .load::<Directory>(conn)
        .expect("We have files")
}

#[tauri::command]
pub async fn add_folder(
    pool: State<'_, DbPool>,
    state: State<'_, Arc<Mutex<TaskQueue>>>,
    path: &str,
) -> Result<Directory, String> {
    use crate::schema::schema::directories;
    let conn = &mut pool.get().map_err(|e| e.to_string())?;

    let new_dir = NewDirectory {
        id: Uuid::new_v4(),
        path: String::from(path),
    };

    let dir_record = diesel::insert_into(directories::table)
        .values(&new_dir)
        .returning(Directory::as_returning())
        .get_result(conn)
        .expect("Error saving dir");

    insert_photos_from_directory(conn, &dir_record).map_err(|e| e.to_string())?;
    let queue = state.lock().await;

    queue.add_task(Task::CreatePreviewForPhotos(dir_record.clone()));

    Ok(dir_record)
}

#[tauri::command]
pub fn get_photos_from_path(pool: State<DbPool>, path: &str) -> Vec<Photo> {
    use crate::schema::schema::directories;
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
