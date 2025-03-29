use crate::face_clustering::detect_faces::detect_faces;
use crate::APP_NAME;
use anyhow::Result;
use db_service::db::DbPoolConn;
use db_service::schema::{Directory, Photo};
use db_service::services::photo::get_photos_from_directory;
use ort::session::Session;
use rayon::prelude::*;
use std::path::Path;
use std::sync::Arc;

pub fn apply_facenet_to_photo() {
    // let input_tensor = preprocess_image(&path);
    //
    // // Run the model using ORT.
    // // This assumes the model takes one input and outputs an embedding vector.
    // let outputs: Vec<OrtOwnedTensor<f32, _>> = session.run(vec![input_tensor.into_dyn()])?;
    //
    // // Assume the model outputs a tensor of shape [1, embedding_dim]
    // let embedding_tensor = &outputs[0];
    // // Flatten the tensor to a 1D array
    // let embedding = embedding_tensor
    //     .view()
    //     .iter()
    //     .copied()
    //     .collect::<Vec<f32>>();
    //
    // embeddings.push(embedding);
    // image_paths.push(path);
}

pub fn face_embeddings_pipeline(
    retinaface_model: Arc<Session>,
    _facenet_model: Arc<Session>,
    directory: Directory,
    conn: &mut DbPoolConn,
) -> Result<()> {
    let photos = get_photos_from_directory(conn, directory.id);

    let local_photo_path = Path::new("/tagging_service/data");
    let output_folder = local_photo_path
        .join(APP_NAME)
        .join(directory.id.to_string());

    // Process images in parallel using Rayon.
    let _results: Vec<(&Photo, Vec<f32>)> = photos
        .par_iter()
        .take(30) // TODO: Ignore
        .map(|photo| {
            // Clone the Arc pointer for each thread.
            let retinaface_model = Arc::clone(&retinaface_model);
            let preview = output_folder.join(format!("{}.preview.{}", photo.id, "webp"));
            let _preview_path = match preview.to_str() {
                Some(path) => path,
                None => return (photo, Vec::new()),
            };

            detect_faces(&preview, photo, retinaface_model).expect("It worked");

            (photo, Vec::new())

            // Attempt to process the image. If an error occurs, return an empty detection list.
            // match detect_objects_for_image(preview_path, &model) {
            //     Ok(detections) => (photo, detections),
            //     Err(err) => {
            //         tracing::error!("Error processing {}: {}", preview_path, err);
            //         (photo, Vec::new())
            //     }
            // }
        })
        .collect();

    Ok(())
}
