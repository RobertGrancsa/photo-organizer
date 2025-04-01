use crate::APP_NAME;
use anyhow::{Context, Result};
use db_service::db::DbPoolConn;
use db_service::schema::{Directory, Photo};
use db_service::services::photo::get_photos_from_directory;
use db_service::services::tags::{Detection, insert_photo_tags_mappings};
use rayon::prelude::*;
use std::collections::HashSet;
use std::path::Path;
use std::sync::Arc;
use yolo_rs::model::YoloModelSession;
use yolo_rs::{YoloEntityOutput, image_to_yolo_input_tensor, inference};

pub fn detect_objects_for_image(
    preview_path: &str,
    model: &YoloModelSession,
) -> Result<HashSet<Detection>> {
    tracing::info!("Loading image {:?}…", preview_path);
    let original_img = image::open(&preview_path)
        .with_context(|| format!("failed to open image {:?}", preview_path))?;

    tracing::debug!("Converting image to tensor…");
    let input = image_to_yolo_input_tensor(&original_img);

    // Run YOLOv11 inference
    tracing::info!("Running inference…");
    let now = std::time::Instant::now();
    let result = inference(&model, input.view())?;
    tracing::info!("Inference took {:?}", now.elapsed());

    tracing::debug!("Drawing bounding boxes…");
    let mut tags = HashSet::new();

    for YoloEntityOutput {
        bounding_box: bbox,
        label,
        confidence,
    } in result
    {
        tracing::info!(
            "Found entity {:?} with confidence {:.2} at ({:.2}, {:.2}) - ({:.2}, {:.2})",
            label,
            confidence,
            bbox.x1,
            bbox.y1,
            bbox.x2,
            bbox.y2
        );

        tags.insert(Detection {
            label: label.to_string(),
            // bbox: [bbox.x1, bbox.y1, bbox.x2, bbox.y2],
        });
    }

    Ok(tags)
}

/// Process a vector of preview image paths using the YOLO11n.pt model.
pub fn detect_objects_batch(
    model_path: String,
    directory: Directory,
    conn: &mut DbPoolConn,
) -> Result<()> {
    tracing::info!("Loading models {:?}...", model_path);
    let model = {
        let mut model = YoloModelSession::from_filename_v8(&model_path)?;
        // .with_context(|| format!("failed to load model {:?}", model_path))?;

        model.probability_threshold = Some(0.5f32);

        model
    };
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

    insert_photo_tags_mappings(conn, results)?;

    Ok(())
}
