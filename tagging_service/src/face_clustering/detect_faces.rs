use crate::face_clustering::nms::{Face, Nms, Rect};
use anyhow::Result;
use image::{DynamicImage, GenericImageView};
use itertools::iproduct;
use ndarray::{Array, Array2, Array4, Axis, s};
use ort::session::Session;
use std::path::{Path, PathBuf};
use std::sync::Arc;

// Variances used for scaling loc outputs.
const VARIANCE0: f32 = 0.1;
const VARIANCE1: f32 = 0.2;

// Mean values to subtract from each channel.
const MEAN_RGB: [f32; 3] = [104.0, 117.0, 123.0];

/// Preprocess the image: load, convert to RGB (if necessary), resize (if needed), and subtract the mean.
/// Returns an ndarray of shape [1, 3, H, W].
fn preprocess_image<P: AsRef<Path>>(img_path: P) -> Result<(Array4<f32>, DynamicImage)> {
    let dyn_img = image::open(img_path)?;
    let img = dyn_img.to_rgb8();
    let (width, height) = img.dimensions();

    // Create ndarray of shape (H, W, 3) from raw pixels.
    let raw_pixels = img.into_raw();
    let mut array =
        Array::from_shape_vec((height as usize, width as usize, 3), raw_pixels)?.map(|&p| p as f32);

    // Subtract mean values for each channel.
    array
        .axis_iter_mut(Axis(2))
        .enumerate()
        .for_each(|(c, mut channel)| {
            channel.map_inplace(|v| *v -= MEAN_RGB[c]);
        });

    // Convert from HWC to CHW and add a batch dimension.
    let chw = array.permuted_axes([2, 0, 1]).insert_axis(Axis(0));
    Ok((chw, dyn_img))
}

/// Generate the prior (anchor) boxes based on the image size and the model’s feature pyramid.
/// This is a placeholder implementation – the actual generation depends on the scales, ratios,
/// and strides defined in the RetinaFace paper and model configuration.
fn generate_priors(image_size: (u32, u32)) -> Vec<(f32, f32, f32, f32)> {
    let step = vec![8, 16, 32];
    let min_sizes_vec = vec![vec![16, 32], vec![64, 128], vec![256, 512]];

    let feature_map_sizes: Vec<(u32, u32)> = step
        .iter()
        .map(|&step| {
            (
                (image_size.0 as f32 / step as f32).ceil() as u32,
                (image_size.1 as f32 / step as f32).ceil() as u32,
            )
        })
        .collect();

    let mut anchors = Vec::new();

    for ((f, min_sizes), step) in feature_map_sizes
        .iter()
        .zip(min_sizes_vec.iter())
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

/// Post-process the outputs to compute the bounding boxes.
/// loc: [1, num_priors, 4] contains offsets.
/// priors: [num_priors, 4] contains anchor box info.
fn decode_boxes(loc: &Array2<f32>, priors: &Vec<(f32, f32, f32, f32)>) -> Array2<f32> {
    let num_loc = loc.shape()[0];
    let mut boxes = Array2::<f32>::zeros((num_loc, 4));

    // For each prior, compute the adjusted bounding box.
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

fn extract_faces(img: &DynamicImage, faces: &[Face]) -> Vec<DynamicImage> {
    let mut face_images = Vec::new();
    let (img_width, img_height) = img.dimensions();

    for face in faces.iter() {
        let rect = face.rect;
        tracing::debug!("{:?}", face);

        let x = (rect.x * img_width as f32).max(0.0);
        let y = (rect.y * img_height as f32).max(0.0);
        let width = rect.width * img_width as f32;
        let height = rect.height * img_height as f32;

        let cropped = img.crop_imm(x as u32, y as u32, width as u32, height as u32);
        face_images.push(cropped);
    }

    face_images
}

pub fn detect_faces(path: &PathBuf, model: Arc<Session>) -> Result<Vec<DynamicImage>> {
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

    let priors = generate_priors(dynamic_image.dimensions());

    // Parse the output tensor.
    let loc_2d = loc.to_owned().into_shape_with_order((loc.shape()[0], 4))?;
    let boxes = decode_boxes(&loc_2d, &priors);

    let threshold: f32 = 0.8;
    let mut faces = Vec::new();
    for i in 0..conf.shape()[0] {
        // Assuming the second column is the positive class score.
        if conf[[i, 1]] > threshold {
            // Get the decoded box for this detection.
            let row = boxes.slice(s![i, ..]);

            let face = Face {
                rect: Rect {
                    x: row[0],
                    y: row[1],
                    width: row[2],
                    height: row[3],
                },
                confidence: conf[[i, 1]],
            };
            faces.push(face);
        }
    }

    if faces.is_empty() {
        tracing::debug!("No faces found, exiting.");
        return Ok(vec![]);
    }

    // Apply non-maximum suppression.
    let nms = Nms::default();
    let faces = nms.suppress_non_maxima(faces);

    tracing::info!("Found {:?} faces:", faces.len());
    let faces_cropped = extract_faces(&dynamic_image, &faces);

    Ok(faces_cropped)
}
