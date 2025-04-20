use crate::face_clustering::face_clustering::cluster_faces;
use crate::face_clustering::face_detection_pipeline::face_embeddings_pipeline;
use anyhow::Result;
use db_service::db::DbPoolConn;
use db_service::services::directory::{change_directories_status, get_directories_by_status};
use ort::session::Session;
use std::sync::Arc;

pub fn face_embeddings_task(conn: &mut DbPoolConn) -> Result<()> {
    let un_processed_dirs = get_directories_by_status(conn, "is_face_tagging_done", false)?;
    const RETINAFACE_MODEL_PATH: &str = "models/retinaface.onnx";
    const FACENET_MODEL_PATH: &str = "models/facenet.onnx";

    if un_processed_dirs.is_empty() {
        tracing::info!("No directories to process for face embeddings");
        return Ok(());
    }

    tracing::info!(
        "Loading models {}, {}...",
        FACENET_MODEL_PATH,
        RETINAFACE_MODEL_PATH
    );
    let retinaface_model = Session::builder()?.commit_from_file(RETINAFACE_MODEL_PATH)?;
    let facenet_model = Session::builder()?.commit_from_file(FACENET_MODEL_PATH)?;
    let retinaface_model = Arc::new(retinaface_model);
    let facenet_model = Arc::new(facenet_model);

    un_processed_dirs.into_iter().for_each(|dir| {
        let name = dir.path.clone();
        let id = dir.id.clone();
        tracing::info!("Starting generation of embeddings for {}", dir.path);
        match face_embeddings_pipeline(
            Arc::clone(&retinaface_model),
            Arc::clone(&facenet_model),
            dir,
            conn,
        ) {
            Ok(_) => {
                tracing::info!("Face embeddings done for {}!", name);
                if let Err(e) = change_directories_status(conn, &id, "is_face_tagging_done") {
                    tracing::error!("Cannot update status for {}: {}", name, e);
                }
            }
            Err(err) => {
                tracing::error!("Face embeddings failed for {}: {}", name, err);
            }
        }
    });

    Ok(())
}

pub fn face_clustering_task(conn: &mut DbPoolConn) -> Result<()> {
    cluster_faces(conn)?;

    Ok(())
}
