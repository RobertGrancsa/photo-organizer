use crate::APP_NAME;
use crate::face_clustering::calculate_embeddings::run_facenet_on_faces;
use crate::face_clustering::detect_faces::detect_faces;
use anyhow::Result;
use db_service::db::DbPoolConn;
use db_service::schema::{Directory, Photo};
use db_service::services::photo::get_photos_from_directory;
use image::DynamicImage;
use ndarray::{Array, Array4, IxDyn};
use ort::session::Session;
use rayon::prelude::*;
use std::path::Path;
use std::sync::Arc;

pub fn face_embeddings_pipeline(
    retinaface_model: Arc<Session>,
    facenet_model: Arc<Session>,
    directory: Directory,
    conn: &mut DbPoolConn,
) -> Result<()> {
    let photos = get_photos_from_directory(conn, directory.id);

    let local_photo_path = Path::new("/tagging_service/data");
    let output_folder = local_photo_path
        .join(APP_NAME)
        .join(directory.id.to_string());

    // Process images in parallel using Rayon.
    let _results: Vec<(&Photo, Vec<Array<f32, IxDyn>>)> = photos
        .par_iter()
        .map(|photo| {
            // Clone the Arc pointer for each thread.
            let retinaface_model = Arc::clone(&retinaface_model);
            let preview = output_folder.join(format!("{}.preview.{}", photo.id, "webp"));

            let faces = match detect_faces(&preview, photo, retinaface_model) {
                Ok(faces) => faces,
                Err(err) => {
                    tracing::error!("Error when detecting faces: {:?}", err);
                    return (photo, Vec::new());
                }
            };

            let facenet_model = Arc::clone(&facenet_model);

            match run_facenet_on_faces(faces, facenet_model) {
                Ok(embeddings) => (photo, embeddings),
                Err(err) => {
                    tracing::error!("Error when creating embeddings: {:?}", err);
                    (photo, Vec::new())
                }
            }
        })
        .collect();

    Ok(())
}
