use crate::db::DbPoolConn;
use crate::schema::{Directory, Photo};
use crate::services::photo::get_photos_from_directory;
use crate::services::tags::insert_photo_tags_mappings;
use crate::APP_NAME;
use anyhow::Result;
use image::ImageReader;
use rayon::prelude::*;
use std::path::Path;
use std::sync::Arc;
use tch::{CModule, Device, Kind, Tensor};

/// A simple detection structure.
#[derive(Debug)]
pub struct Detection {
    pub label: String,
    pub class_idx: usize,
    // pub score: f32,
    // /// Bounding box in the format [x_min, y_min, x_max, y_max]
    // pub bbox: [f32; 4],
}

/// A list of labels corresponding to the model’s output classes.
/// Adjust this list to match the classes used in your model.
pub const NAMES: [&str; 80] = [
    "person",
    "bicycle",
    "car",
    "motorbike",
    "aeroplane",
    "bus",
    "train",
    "truck",
    "boat",
    "traffic light",
    "fire hydrant",
    "stop sign",
    "parking meter",
    "bench",
    "bird",
    "cat",
    "dog",
    "horse",
    "sheep",
    "cow",
    "elephant",
    "bear",
    "zebra",
    "giraffe",
    "backpack",
    "umbrella",
    "handbag",
    "tie",
    "suitcase",
    "frisbee",
    "skis",
    "snowboard",
    "sports ball",
    "kite",
    "baseball bat",
    "baseball glove",
    "skateboard",
    "surfboard",
    "tennis racket",
    "bottle",
    "wine glass",
    "cup",
    "fork",
    "knife",
    "spoon",
    "bowl",
    "banana",
    "apple",
    "sandwich",
    "orange",
    "broccoli",
    "carrot",
    "hot dog",
    "pizza",
    "donut",
    "cake",
    "chair",
    "sofa",
    "pottedplant",
    "bed",
    "diningtable",
    "toilet",
    "tvmonitor",
    "laptop",
    "mouse",
    "remote",
    "keyboard",
    "cell phone",
    "microwave",
    "oven",
    "toaster",
    "sink",
    "refrigerator",
    "book",
    "clock",
    "vase",
    "scissors",
    "teddy bear",
    "hair drier",
    "toothbrush",
];

/// Detect objects in a preview image using the YOLO11n.pt model.
/// The image is expected to be a preview (e.g. already generated).
///
/// The model is assumed to expect a 640x640 input. Adjust if necessary.
pub fn detect_objects_for_image(preview_path: &str, model: &CModule) -> Result<Vec<Detection>> {
    // Use CUDA if available.
    let device = Device::cuda_if_available();

    // Load the preview image.
    let img = ImageReader::open(preview_path)?.decode()?.to_rgb8();
    let (orig_width, orig_height) = img.dimensions();
    let input_size = 300; // TODO replace with 640

    // Convert image to tensor: HWC -> CHW and normalize to [0,1].
    let img_tensor = Tensor::from_data_size(
        &img.into_raw(),
        &[input_size as i64, input_size as i64, 3],
        Kind::Uint8,
    )
    .to_device(device)
    .permute(&[2, 0, 1]) // shape now: [3, H, W]
    .to_kind(Kind::Float)
        / 255.0;

    // Add a batch dimension: shape [1, 3, H, W]
    let input_tensor = img_tensor.unsqueeze(0);

    // Run the model.
    let output = model.forward_ts(&[input_tensor])?;
    // Move output to CPU and remove the batch dimension.
    let output = output.to_device(Device::Cpu).squeeze_dim(0);

    // Convert output tensor to a flat Vec<f32>.
    let output_data: Vec<f32> = Vec::<f32>::try_from(&output)?;
    // Get the number of predictions. We assume each prediction has 6 values.
    let num_predictions = output.size()[0] as usize;
    let mut detections = Vec::new();

    // Process each prediction.
    for i in 0..num_predictions {
        let offset = i * 6;
        // Retrieve normalized coordinates, score, and class index.
        let x_min_norm = output_data[offset];
        let y_min_norm = output_data[offset + 1];
        let x_max_norm = output_data[offset + 2];
        let y_max_norm = output_data[offset + 3];
        let score = output_data[offset + 4];
        let class_idx = output_data[offset + 5] as usize;

        // Use a threshold to filter out low confidence predictions.
        if score < 0.5 {
            continue;
        }

        // Scale bounding box coordinates back to original image size.
        // Note: We assumed the model input size is 640x640.
        let x_scale = orig_width as f32 / input_size as f32;
        let y_scale = orig_height as f32 / input_size as f32;

        let _bbox = [
            x_min_norm * input_size as f32 * x_scale,
            y_min_norm * input_size as f32 * y_scale,
            x_max_norm * input_size as f32 * x_scale,
            y_max_norm * input_size as f32 * y_scale,
        ];

        // Map the class index to a label.
        let label = NAMES.get(class_idx).unwrap_or(&"unknown").to_string();

        detections.push(Detection { label, class_idx });
    }

    Ok(detections)
}

/// Process a vector of preview image paths using the YOLO11n.pt model.
/// Returns a vector of tuples: (preview_path, detections)
pub fn detect_objects_batch(
    model_path: String,
    directory: Directory,
    conn: &mut DbPoolConn,
) -> Result<()> {
    // Use CUDA if available.
    let device = Device::cuda_if_available();
    // Load the TorchScript model once.
    let model = CModule::load_on_device(model_path, device)?;
    // Wrap the model in an Arc to share between threads.
    let model = Arc::new(model);

    let photos = get_photos_from_directory(conn, directory.id);

    let local_photo_path = dirs::data_local_dir().unwrap_or_else(|| Path::new(".").to_path_buf());
    let output_folder = local_photo_path
        .join(APP_NAME)
        .join(directory.id.to_string());

    // Process images in parallel using Rayon.
    let results: Vec<(&Photo, Vec<Detection>)> = photos
        .par_iter()
        .map(|photo| {
            // Clone the Arc pointer for each thread.
            let model = Arc::clone(&model);
            let preview = output_folder.join(format!("{}.preview.{}", photo.id, "avif"));
            let preview_path = match preview.to_str() {
                Some(path) => path,
                None => return (photo, Vec::new()),
            };

            // Attempt to process the image. If an error occurs, return an empty detection list.
            match detect_objects_for_image(preview_path, &model) {
                Ok(detections) => (photo, detections),
                Err(err) => {
                    eprintln!("Error processing {}: {}", preview_path, err);
                    (photo, Vec::new())
                }
            }
        })
        .collect();

    insert_photo_tags_mappings(conn, results)?;

    Ok(())
}
