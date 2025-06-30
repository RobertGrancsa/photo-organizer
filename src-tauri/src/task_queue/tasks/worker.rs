use crate::task_queue::tasks::Task;
use crate::APP_NAME;
use anyhow::{anyhow, Result};
use db_service::db::{DbPool, DbPoolConn};
use db_service::schema::Directory;
use db_service::services::directory::change_directories_status;
use db_service::services::photo::get_photos_from_directory;
use image::imageops::FilterType;
use image::ImageFormat;
use rayon::prelude::*;
use std::fs;
use std::path::Path;
use std::sync::atomic::AtomicU32;
use std::time::Duration;
use tauri::Emitter;
use tokio::sync::mpsc;
use tokio::time::sleep;

pub async fn task_worker(
    mut receiver: mpsc::UnboundedReceiver<Task>,
    db_pool: DbPool,
    app_handle: tauri::AppHandle,
) {
    while let Some(task) = receiver.recv().await {
        let conn = &mut db_pool.get().expect("Conn is available");
        match task {
            Task::AddPhotosToDatabase(msg) => {
                println!("Processing message: {}", msg);
            }
            Task::CreatePreviewForPhotos(dir) => {
                sleep(Duration::from_secs(10)).await;
                match create_preview_for_photos(dir, conn, app_handle.clone()).await {
                    Ok(_) => {}
                    Err(err) => {
                        tracing::error!("{}", err)
                    }
                };
            }
            _ => {}
        }
    }
}

pub async fn create_preview_for_photos(
    dir: Directory,
    conn: &mut DbPoolConn,
    app_handle: tauri::AppHandle,
) -> Result<()> {
    let photos = get_photos_from_directory(conn, dir.id);
    let total_photos = photos.len();

    if photos.is_empty() {
        println!("No photos found in directory: {}", dir.path);
        return Err(anyhow!("No photos found in directory: {}", dir.path));
    }

    let local_photo_path = dirs::data_local_dir().unwrap_or_else(|| Path::new(".").to_path_buf());

    let output_folder = local_photo_path.join(APP_NAME).join(dir.id.to_string());

    fs::create_dir_all(&output_folder)?;

    tracing::info!("Started preview creation for: {}", dir.path);

    // Emit the "preview-start" event to notify that preview generation is beginning.
    if let Err(e) = app_handle.emit("preview-start", &dir.path) {
        tracing::error!("Failed to emit preview-start event: {}", e);
    }

    // Create an unbounded channel for reporting progress.
    let (progress_tx, mut progress_rx) = mpsc::unbounded_channel::<u32>();

    // Spawn an async task that listens for progress messages and emits them
    // to the front-end as percentage updates.
    let progress_handle = {
        let app_handle = app_handle.clone();
        tokio::spawn(async move {
            tracing::warn!("Starting progress listener");
            while let Some(completed) = progress_rx.recv().await {
                // Calculate progress percentage.
                let progress = (completed as f64 / total_photos as f64) * 100.0;
                if let Err(e) = app_handle.emit("preview-progress", progress) {
                    tracing::error!("Failed to emit preview progress: {}", e);
                }
                tracing::info!("Sending status {}", progress);
            }
        })
    };
    let counter = AtomicU32::new(0);

    photos.par_iter().for_each(|photo| {
        let input_path = Path::new(&dir.path).join(&photo.name);
        if !input_path.exists() {
            tracing::error!("File not found: {:?}", input_path);
            return;
        }

        let output_path = output_folder.join(format!("{}.preview.{}", photo.id, "webp"));

        if output_path.exists() {
            tracing::debug!("Preview already exists, skipping: {:?}", input_path);
            let new_count = counter.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
            let _ = progress_tx.send(new_count);
            return;
        }

        match image::open(input_path) {
            Ok(img) => {
                let resized = img.resize(640, 640, FilterType::CatmullRom);
                if let Err(e) = resized.save_with_format(&output_path, ImageFormat::WebP) {
                    tracing::error!("Failed to save preview for {}: {}", photo.path, e);
                } else {
                    tracing::debug!("Preview saved at {:?}", output_path);
                }
            }
            Err(e) => {
                tracing::error!("Failed to open image {}: {}", photo.name, e);
            }
        }

        let new_count = counter.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        let status = progress_tx.send(new_count);

        tracing::info!("Status is {:?}", status);
    });

    drop(progress_tx);
    let _ = progress_handle.await;

    // Emit the "preview-end" event to notify that preview generation is complete.
    if let Err(e) = app_handle.emit("preview-end", &dir.path) {
        tracing::error!("Failed to emit preview-end event: {}", e);
    }

    tracing::info!("Finished processing previews for directory: {}", dir.path);
    change_directories_status(conn, &dir.id, "is_imported")
}
