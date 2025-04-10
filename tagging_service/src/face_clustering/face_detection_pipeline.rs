use crate::APP_NAME;
use crate::face_clustering::calculate_embeddings::run_facenet_on_faces;
use crate::face_clustering::detect_faces::detect_faces;
use anyhow::Result;
use db_service::db::DbPoolConn;
use db_service::schema::{Directory, Photo};
use db_service::services::embeddings::add_embeddings;
use db_service::services::photo::get_photos_from_directory;
use image::{DynamicImage, ImageFormat};
use ort::session::Session;
use rayon::prelude::*;
use std::fs;
use std::path::Path;
use std::sync::Arc;
use uuid::Uuid;

fn save_cropped_faces(faces_cropped: &Vec<DynamicImage>, directory: &Path) -> Vec<Uuid> {
    // Save cropped faces
    faces_cropped
        .iter()
        .map(|face| {
            let uuid = Uuid::new_v4();
            let output_path = directory.join("faces").join(format!("{:?}.webp", uuid));

            if let Err(e) = face.save_with_format(&output_path, ImageFormat::WebP) {
                tracing::error!("Failed to save face at path {:?}: {:?}", output_path, e);
            }

            uuid
        })
        .collect()
}

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

    fs::create_dir_all(&output_folder.join("faces"))?;

    // Process images in parallel using Rayon.
    let results: Vec<(&Photo, Vec<Uuid>, Vec<Vec<f32>>)> = photos
        .par_iter()
        .map(|photo| {
            // Clone the Arc pointer for each thread.
            let retinaface_model = Arc::clone(&retinaface_model);
            let preview = output_folder.join(format!("{}.preview.{}", photo.id, "webp"));

            let faces = match detect_faces(&preview, retinaface_model) {
                Ok(faces) => faces,
                Err(err) => {
                    tracing::error!("Error when detecting faces: {:?}", err);
                    return (photo, Vec::new(), Vec::new());
                }
            };

            let ids = save_cropped_faces(&faces, &output_folder);

            let facenet_model = Arc::clone(&facenet_model);

            match run_facenet_on_faces(faces, facenet_model) {
                Ok(embeddings) => (photo, ids, embeddings),
                Err(err) => {
                    tracing::error!("Error when creating embeddings: {:?}", err);
                    (photo, Vec::new(), Vec::new())
                }
            }
        })
        .collect();

    add_embeddings(conn, results)?;

    Ok(())
}
