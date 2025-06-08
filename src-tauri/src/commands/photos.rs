use tauri::State;
use uuid::Uuid;

use crate::commands::types::PhotoData;
use db_service::db::DbPool;
use db_service::schema::PhotoSummary;
use db_service::services::directory::get_directory_id_by_name;
use db_service::services::metadata::get_basic_metadata_for_photos;
use db_service::services::photo::get_photos_filtered;
use db_service::services::tags::get_unique_filters;

#[tracing::instrument]
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
        Some(uuid) => Some(uuid),
        None => {
            if path.is_empty() {
                tracing::error!("Path is empty, returning all");
                None
            } else {
                tracing::error!("No UUID found for path: {}", path);
                return Ok(PhotoData {
                    photos: vec![],
                    tags: vec![],
                });
            }
        }
    };

    Ok(PhotoData {
        photos: get_photos_filtered(conn, path_uuid, tag_filters).map_err(|e| e.to_string())?,
        tags: get_unique_filters(conn, path_uuid).map_err(|e| e.to_string())?,
    })
}

#[tracing::instrument]
#[tauri::command]
pub fn get_basic_metadata(
    pool: State<DbPool>,
    photo_ids: Vec<Uuid>,
) -> Result<Vec<PhotoSummary>, String> {
    let conn = &mut pool.get().map_err(|e| e.to_string())?;

    let results = get_basic_metadata_for_photos(conn, &photo_ids).map_err(|e| e.to_string())?;

    Ok(results)
}
