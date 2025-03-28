use std::path::Path;
use std::sync::Arc;
use anyhow::Result;
use ort::environment::Environment;
use ort::session::builder::SessionBuilder;
use ort::session::Session;
use rayon::prelude::*;
use yolo_rs::error::YoloError;
use db_service::db::DbPoolConn;
use db_service::schema::Directory;
use db_service::services::photo::get_photos_from_directory;
use crate::APP_NAME;

pub fn create_face_embeddings(
    model: Arc<Session>,
    directory: Directory,
    conn: &mut DbPoolConn,
) -> Result<()> {
    // Wrap the model in an Arc to share between threads.
    let model = Arc::new(model);

    let photos = get_photos_from_directory(conn, directory.id);

    let local_photo_path = Path::new("/tagging_service/data");
    let output_folder = local_photo_path
        .join(APP_NAME)
        .join(directory.id.to_string());

    // Process images in parallel using Rayon.
    let results: Vec<(&Photo, HashSet<Detection>)> = photos
        .par_iter()
        .map(|photo| {
            // Clone the Arc pointer for each thread.
            let model = Arc::clone(&model);
            let preview = output_folder.join(format!("{}.preview.{}", photo.id, "webp"));
            let preview_path = match preview.to_str() {
                Some(path) => path,
                None => return (photo, HashSet::new()),
            };

            // Attempt to process the image. If an error occurs, return an empty detection list.
            match detect_objects_for_image(preview_path, &model) {
                Ok(detections) => (photo, detections),
                Err(err) => {
                    tracing::error!("Error processing {}: {}", preview_path, err);
                    (photo, HashSet::new())
                }
            }
        })
        .collect();

    Ok(())
}
