use anyhow::Result;
use db_service::schema::Photo;
use image::DynamicImage;
use image::imageops::FilterType;
use ndarray::{Array, Array1, Array4, Axis, IxDyn};
use ort::session::Session;
use std::sync::Arc;

/// Preprocess a face image for FaceNet:
/// - Resize to the target size (e.g., 160x160)
/// - Convert to RGB if needed
/// - Convert to a tensor of shape [1, 3, H, W]
/// - Normalize pixels to the range [-1, 1] (i.e. (pixel/127.5) - 1.0)
fn preprocess_face_for_facenet(
    face_img: &DynamicImage,
    target_size: (u32, u32),
) -> Result<Array4<f32>> {
    // Resize the face image to the desired input size.
    let resized = face_img.resize_exact(target_size.0, target_size.1, FilterType::CatmullRom);
    let img = resized.to_rgb8();
    let (width, height) = img.dimensions();

    // Create an ndarray of shape (height, width, 3) from the image data.
    let raw_pixels = img.into_raw();
    let mut array =
        Array::from_shape_vec((height as usize, width as usize, 3), raw_pixels)?.map(|&p| p as f32);

    // Normalize pixel values to [-1, 1]:
    array.map_inplace(|p| *p = (*p / 127.5) - 1.0);

    // Convert from HWC to CHW and add the batch dimension, resulting in shape [1, H, W, 3].
    let chw = array.insert_axis(Axis(0));
    Ok(chw)
}

/// Run FaceNet on the cropped face images and return their embeddings.
/// - `face_images`: Vector of cropped face images (DynamicImage).
/// - `facenet_session`: ONNX Runtime session loaded with the FaceNet model.
pub fn run_facenet_on_faces(
    face_images: Vec<DynamicImage>,
    model: Arc<Session>,
) -> Result<Vec<Array<f32, IxDyn>>> {
    // Target size for FaceNet input. Adjust according to your model.
    let target_size = (160, 160);
    let mut embeddings = Vec::with_capacity(face_images.len());

    for face_img in face_images.iter() {
        // Preprocess the face image.
        let input_tensor = preprocess_face_for_facenet(face_img, target_size)?;

        // Run inference on the preprocessed face image.
        tracing::info!("Running face embedding creation…");
        let now = std::time::Instant::now();
        let outputs = model.run(ort::inputs![input_tensor]?)?;
        tracing::info!("Face embedding took {:?}", now.elapsed());

        // Assume that outputs[0] contains the embedding vector with shape [1, embedding_size].
        let embedding_tensor = outputs[0].try_extract_tensor::<f32>()?;
        // Remove the batch dimension.
        let embedding = embedding_tensor.view().index_axis(Axis(0), 0).to_owned();
        embeddings.push(embedding);
    }

    Ok(embeddings)
}
