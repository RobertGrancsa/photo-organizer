use db_service::db::DbPool;
use db_service::services::directory::get_directory_id_by_name;
use db_service::services::faces::fetch_faces_grouped;
use std::collections::HashMap;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_face_clusters(
    pool: State<DbPool>,
    dirs: Option<Vec<String>>,
) -> Result<HashMap<Uuid, Vec<Uuid>>, String> {
    let conn = &mut pool.get().map_err(|err| err.to_string())?;

    let path_uuid: Option<Vec<Uuid>> = dirs.map(|directories| {
        directories
            .into_iter()
            .map(
                |dir| get_directory_id_by_name(conn, &*dir).expect("Should have item"), // .map(|dir| dir.to_string())
            )
            .collect()
    });

    let clusters = fetch_faces_grouped(conn, path_uuid).map_err(|err| err.to_string())?;

    Ok(clusters)
}
