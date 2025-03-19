use crate::tagging::yolo_detect::detect_objects_batch;
use anyhow::Result;
use db_service::db::DbPoolConn;
use db_service::services::directory::get_directories;

pub fn tagging_task(conn: &mut DbPoolConn) -> Result<()> {
    let un_processed_dirs = get_directories(conn)?;

    un_processed_dirs.into_iter().for_each(|dir| {
        let name = dir.path.clone();
        tracing::info!("Starting processing of {}", dir.path);
        match detect_objects_batch(String::from("models/yolo11n.onnx"), dir, conn) {
            Ok(_) => {
                tracing::info!("Object detection done for {}!", name);
            }
            Err(err) => {
                tracing::error!("Object detection failed for {}: {}", name, err);
            }
        }
    });

    Ok(())
}
