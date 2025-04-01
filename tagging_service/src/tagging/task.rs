use crate::tagging::yolo_detect::detect_objects_batch;
use anyhow::Result;
use db_service::db::DbPoolConn;
use db_service::services::directory::{change_directories_status, get_directories_by_status};

pub fn tagging_task(conn: &mut DbPoolConn) -> Result<()> {
    let un_processed_dirs = get_directories_by_status(conn, "is_tagged", false)?;

    if un_processed_dirs.is_empty() {
        tracing::info!("No directories to process for tagging");
        return Ok(());
    }

    un_processed_dirs.into_iter().for_each(|dir| {
        let name = dir.path.clone();
        let id = dir.id.clone();
        tracing::info!("Starting processing of {}", dir.path);
        match detect_objects_batch(String::from("models/yolo11n.onnx"), dir, conn) {
            Ok(_) => {
                tracing::info!("Object detection done for {}!", name);
                if let Err(e) = change_directories_status(conn, &id, "is_tagged") {
                    tracing::error!("Cannot update status for {}: {}", name, e);
                }
            }
            Err(err) => {
                tracing::error!("Object detection failed for {}: {}", name, err);
            }
        }
    });

    Ok(())
}
