use anyhow::{anyhow, Result};
use image::{imageops, DynamicImage, GenericImageView, ImageReader, RgbImage, RgbaImage};
use ndarray::{s, Array, Array2, Array3, Array4, ArrayD, ArrayViewD, Axis, Ix, Ix1};
use ort::session::output::Values;
use ort::session::{Session, SessionOutputs};
use ort::value::{DynValue, Value};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use db_service::schema::Photo;
use itertools::iproduct;

// Variances used for scaling loc outputs.
const VARIANCE0: f32 = 0.1;
const VARIANCE1: f32 = 0.2;

// Mean values to subtract from each channel.
const MEAN_RGB: [f32; 3] = [104.0, 117.0, 123.0];
// const MEAN_RGB: [f32; 3] = [123.0, 117.0, 104.0];

/// Preprocess the image: load, convert to RGB (if necessary), resize (if needed), and subtract the mean.
/// Returns an ndarray of shape [1, 3, H, W].
fn preprocess_image<P: AsRef<Path>>(img_path: P) -> Result<(Array4<f32>, DynamicImage)> {
    // Load the image from disk.
    let dyn_img = image::open(img_path)?;
    let img = dyn_img.to_rgb8();
    let (width, height) = img.dimensions();
    tracing::debug!("Got here first");

    // Create an ndarray with shape (height, width, channels).
    let raw_pixels = img.into_raw();
    let mut array = Array::from_shape_vec((height as usize, width as usize, 3), raw_pixels)?
        .map(|&p| p as f32);

    // Subtract the mean from each channel.
    array
        .axis_iter_mut(Axis(2))
        .enumerate()
        .for_each(|(c, mut channel)| {
            channel.map_inplace(|v| *v -= MEAN_RGB[c]);
        });

    // Convert HWC to CHW and add a batch dimension.
    let chw = array
        .permuted_axes([2, 0, 1])
        .insert_axis(Axis(0)); // shape: [1, 3, H, W]

    Ok((chw, dyn_img))
}

/// Generate the prior (anchor) boxes based on the image size and the model’s feature pyramid.
/// This is a placeholder implementation – the actual generation depends on the scales, ratios,
/// and strides defined in the RetinaFace paper and model configuration.
fn generate_priors(image_size: (u32, u32), num_priors: Ix) -> Vec<(f32, f32, f32, f32)> {
    let step = vec![8, 16];

    let feature_map_sizes: Vec<(u32, u32)> = step
        .iter()
        .map(|&step| ((image_size.0 as f32 / step as f32).ceil() as u32, (image_size.1 as f32 / step as f32).ceil() as u32))
        .collect();

    let mut anchors = Vec::new();

    for ((f, min_sizes), step) in feature_map_sizes
        .iter()
        .zip(vec![vec![8, 11], vec![14, 19, 26, 38, 64, 149]].iter())
        .zip(step.iter())
    {
        let step = *step;
        for (i, j) in iproduct!(0..f.1, 0..f.0) {
            for min_size in min_sizes {
                let s_kx = *min_size as f32 / image_size.0 as f32;
                let s_ky = *min_size as f32 / image_size.1 as f32;
                let cx = (j as f32 + 0.5) * step as f32 / image_size.0 as f32;
                let cy = (i as f32 + 0.5) * step as f32 / image_size.1 as f32;
                anchors.push((cx, cy, s_kx, s_ky));
            }
        }
    }

    anchors
}

/// Parse the RetinaFace model output.
/// This function assumes the output tensor has shape [1, N, 6] where each detection is
/// [x1, y1, x2, y2, score, extra]. Only detections with score above a threshold are returned.
fn parse_retinaface_output(output_boxes: &DynValue, output_scores: &DynValue, score_threshold: f32) -> Result<Vec<(f32, f32, f32, f32, f32)>> {
    let output = output_boxes.try_extract_tensor::<f32>()?;
    let output_scores = output_scores.try_extract_tensor::<f32>()?;
    let num_boxes = output.view().shape()[1];

    tracing::debug!("Box shape is {:?}", output.shape());
    tracing::debug!("Score shape is {:?}", output_scores.shape());

    // let n_detections = output_data.len() / 6;
    // let mut boxes = Vec::new();
    tracing::debug!("Starting detection analysis");

    let boxes = output
        .view()
        .to_shape((num_boxes, 4))?
        .axis_iter(Axis(0))
        .zip(output_scores.view().to_shape((num_boxes, 2))?.axis_iter(Axis(0)))
        .filter_map(|(rect, score)| {
            let score = score[1];
            let x1 = rect[0_usize];
            let y1 = rect[1_usize];
            let x2 = rect[2_usize];
            let y2 = rect[3_usize];
            if score > score_threshold {
                return Some((x1, y1, x2, y2, score));
            }

            None
        }).collect::<Vec<(f32, f32, f32, f32, f32)>>();

    // for i in 0..n_detections {
    //     let start = i * 6;
    //     let x1 = output_data[start];
    //     let y1 = output_data[start + 1];
    //     let x2 = output_data[start + 2];
    //     let y2 = output_data[start + 3];
    //     let score = output_data[start + 4];
    //     if score > score_threshold {
    //         boxes.push((x1, y1, x2, y2, score));
    //     }
    // }
    Ok(boxes)
}

/// Post-process the outputs to compute the bounding boxes.
/// loc: [1, num_priors, 4] contains offsets.
/// priors: [num_priors, 4] contains anchor box info.
fn decode_boxes(loc: &Array2<f32>, priors: &Vec<(f32, f32, f32, f32)>) -> Array2<f32> {
    let num_loc = loc.shape()[0];
    let mut boxes = Array2::<f32>::zeros((num_loc, 4));

    // For each prior, compute the adjusted bounding box.
    // for i in 0..num_loc {
    //     let (cx, cy, s_kx, s_ky) = priors[i];
    //
    //     let dx = loc[[i, 0]] * VARIANCE0;
    //     let dy = loc[[i, 1]] * VARIANCE0;
    //     let dw = loc[[i, 2]] * VARIANCE1;
    //     let dh = loc[[i, 3]] * VARIANCE1;
    //
    //     // Adjust center coordinates.
    //     let box_cx = cx + dx * s_kx;
    //     let box_cy = cy + dy * s_ky;
    //     // Adjust width and height.
    //     let box_w = s_kx * dw.exp();
    //     let box_h = s_ky * dh.exp();
    //
    //     // Convert from center-size to [xmin, ymin, xmax, ymax].
    //     let xmin = box_cx - box_w / 2.0;
    //     let ymin = box_cy - box_h / 2.0;
    //     let xmax = box_cx + box_w;
    //     let ymax = box_cy + box_h;
    //     boxes[[i, 0]] = xmin;
    //     boxes[[i, 1]] = ymin;
    //     boxes[[i, 2]] = xmax;
    //     boxes[[i, 3]] = ymax;
    // }

    for i in 0..num_loc {
        let (anchor_cx, anchor_cy, s_kx, s_ky) = priors[i];
        let x1 = loc[[i, 0]];
        let y1 = loc[[i, 1]];
        let x2 = loc[[i, 2]];
        let y2 = loc[[i, 3]];

        let cx = anchor_cx + x1 * VARIANCE0 * s_kx;
        let cy = anchor_cy + y1 * VARIANCE0 * s_ky;
        let width = s_kx * (x2 * VARIANCE1).exp();
        let height = s_ky * (y2 * VARIANCE1).exp();
        let x_start = cx - width / 2.0;
        let y_start = cy - height / 2.0;
        boxes[[i, 0]] = x_start;
        boxes[[i, 1]] = y_start;
        boxes[[i, 2]] = width;
        boxes[[i, 3]] = height;
    }

    boxes
}

fn extract_faces(img: &DynamicImage, boxes: &Vec<Array<f32, Ix1>>) -> Vec<DynamicImage> {
    let mut face_images = Vec::new();
    let ratio = (640.0 / img.width() as f32)
        .min(640.0 / img.height() as f32)
        .min(1.0);
    let scale_ratios = (img.width() as f32 / ratio, img.height() as f32 / ratio);

    for face in boxes.iter() {
        tracing::debug!("{:?}", face);

        let x1 = (face[0] * scale_ratios.0) as u32;
        let y1 = (face[1] * scale_ratios.1) as u32;
        let w = (face[2] * scale_ratios.0) as u32;
        let h = (face[3] * scale_ratios.1) as u32;

        let cropped = img.crop_imm(x1, y1, w, h);
        face_images.push(cropped);
    }

    face_images
}

pub fn detect_faces(path: &PathBuf, photo: &Photo, model: Arc<Session>) -> Result<()> {
    // rust_face(path, photo)?;
    // return Ok(());

    let (input_tensor, dynamic_image) = preprocess_image(&path)?;

    // Run the RetinaFace model.
    tracing::info!("Running face detection…");
    let now = std::time::Instant::now();
    let outputs = model.run(ort::inputs![input_tensor]?)?;
    tracing::info!("Face detection took {:?}", now.elapsed());

    let loc_tensor = outputs[0].try_extract_tensor::<f32>()?;
    let conf_tensor = outputs[1].try_extract_tensor::<f32>()?;

    let loc = loc_tensor.index_axis(Axis(0), 0);
    let conf = conf_tensor.index_axis(Axis(0), 0);

    let priors = generate_priors(dynamic_image.dimensions(), loc.shape()[0]);

    // Parse the output tensor.
    let loc_2d = loc.to_owned().into_shape_with_order((loc.shape()[0], 4))?;
    let boxes = decode_boxes(&loc_2d, &priors);

    // For each detected face, you might further crop the region and run a face embedding model.
    // For now, we just print out the bounding boxes and scores.
    let threshold: f32 = 0.8;
    let mut final_boxes = Vec::new();
    for i in 0..conf.shape()[0] {
        // Assuming the second column is the positive class score.
        if conf[[i, 1]] > threshold {
            final_boxes.push(boxes.row(i).to_owned());
        }
    }
    tracing::info!("Found {:?} faces:", final_boxes.len());

    if final_boxes.is_empty() {
        tracing::debug!("No faces found, exiting.");
        return Ok(());
    }

    // For demonstration, print the first few bounding boxes.
    tracing::info!("Detected boxes (first 5):");
    for (i, b) in final_boxes.iter().enumerate() {
        tracing::info!(
            "Box in {:?} {}: xmin: {:.3}, ymin: {:.3}, xmax: {:.3}, ymax: {:.3}",
            path.to_str(), i, b[0], b[1], b[2], b[3]
        );
    }

    let faces = extract_faces(&dynamic_image, &final_boxes);

    // Save cropped faces
    for (i, face) in faces.iter().enumerate() {
        let output_path = format!("/tagging_service/data/photo-organizer/faces/{:?}_{}.webp", photo.id, i);
        face.save(output_path).expect("Failed to save cropped face");
    }

    Ok(())
}

// use rust_faces::{BlazeFaceParams, Face, FaceDetection, FaceDetector, FaceDetectorBuilder, InferParams, Provider, ToArray3, ToRgb8};
//
// fn image_to_array3(image: RgbImage) -> Array3<u8> {
//     let (width, height) = image.dimensions();
//     let data = image.into_raw();
//     // Create an Array3 from raw image data.
//     // Note: image crate stores images in row-major order (height, width, channel).
//     Array3::from_shape_vec(
//         (height as usize, width as usize, 3),
//         data,
//     )
//     .expect("Error converting image to Array3")
// }
//
// pub fn rust_face(path: &PathBuf, photo: &Photo) -> Result<()> {
//     // Initialize the detector. You might provide the path to your ONNX model file.
//     let face_detector =
//         FaceDetectorBuilder::new(FaceDetection::BlazeFace640(BlazeFaceParams::default()))
//             .download()
//             .infer_params(InferParams {
//                 provider: Provider::OrtCpu,
//                 intra_threads: Some(5),
//                 ..Default::default()
//             })
//             .build()
//             .expect("Fail to load the face detector.");
//
//
//     // Load an image using the image crate.
//     let img = image::open(path)
//         .expect("Can't open test image.")
//         .into_rgb8();
//
//     // Use the helper function to convert the image into an Array3
//     let image_array: Array3<u8> = image_to_array3(img);
//     let image_view: ArrayViewD<u8> = image_array.view().into_dyn();
//
//     let faces = unsafe {
//         // Detect faces in the image.
//         let faces = face_detector.detect(image_view)?;
//
//         faces
//     };
//
//     // Iterate through detected faces and print details.
//     for Face {
//         rect, confidence, ..
//     } in faces {
//         println!("Detected face: bounding box {:.2} = {:?}", confidence, rect);
//     }
//
//     Ok(())
// }