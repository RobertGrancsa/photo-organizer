use std::sync::Arc;
use ort::session::Session;
use yolo_rs::error::YoloError;
use db_service::db::DbPoolConn;
use db_service::services::directory::{change_directories_status, get_directories_by_status};
use crate::face_clustering::face_embeddings::create_face_embeddings;
use crate::tagging::yolo_detect::detect_objects_batch;

pub fn tagging_task(conn: &mut DbPoolConn) -> anyhow::Result<()> {
    let un_processed_dirs = get_directories_by_status(conn, "is_face_tagging_done", false)?;
    const MODEL_PATH: &str = "models/facenet.onnx";

    tracing::info!("Loading models {:?}...", MODEL_PATH);
    let model = Session::builder()
        .map_err(YoloError::OrtSessionBuildError)?
        .commit_from_file(MODEL_PATH)
        .map_err(YoloError::OrtSessionLoadError)?;

    un_processed_dirs.into_iter().for_each(|dir| {
        let name = dir.path.clone();
        let id = dir.id.clone();
        tracing::info!("Starting generation of embeddings for {}", dir.path);
        match create_face_embeddings(Arc::clone(&model), dir, conn) {
            Ok(_) => {
                tracing::info!("Object detection done for {}!", name);
                if let Err(e) = change_directories_status(conn,  &id,"is_tagged") {
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