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
use tokio::sync::mpsc;

pub async fn task_worker(mut receiver: mpsc::UnboundedReceiver<Task>, db_pool: DbPool) {
    while let Some(task) = receiver.recv().await {
        let conn = &mut db_pool.get().expect("Conn is available");
        match task {
            Task::AddPhotosToDatabase(msg) => {
                println!("Processing message: {}", msg);
            }
            Task::CreatePreviewForPhotos(dir) => {
                match create_preview_for_photos(dir, conn).await {
                    Ok(_) => {}
                    Err(err) => {
                        tracing::error!("{}", err)
                    }
                };
            }
            // Task::DetectObjectsFromPhotos(dir, name) => {
            //
            // }
            _ => {}
        }
    }
}

pub async fn create_preview_for_photos(dir: Directory, conn: &mut DbPoolConn) -> Result<()> {
    let photos = get_photos_from_directory(conn, dir.id);

    if photos.is_empty() {
        println!("No photos found in directory: {}", dir.path);
        return Err(anyhow!("No photos found in directory: {}", dir.path));
    }

    let local_photo_path = dirs::data_local_dir().unwrap_or_else(|| Path::new(".").to_path_buf());

    let output_folder = local_photo_path.join(APP_NAME).join(dir.id.to_string());

    fs::create_dir_all(&output_folder).expect("Failed to create preview directory");

    photos.par_iter().for_each(|photo| {
        let input_path = Path::new(&dir.path).join(&photo.name);
        if !input_path.exists() {
            tracing::error!("File not found: {:?}", input_path);
            return;
        }

        let output_path = output_folder.join(format!("{}.preview.{}", photo.id, "webp"));

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
    });

    tracing::info!("Finished processing previews for directory: {}", dir.path);
    change_directories_status(conn, &dir.id, "is_imported")
}
