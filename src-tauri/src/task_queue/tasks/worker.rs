use std::fs;
use crate::db::{DbPool, DbPoolConn};
use crate::schema::Directory;
use crate::services::photo::get_photos_from_directory;
use crate::task_queue::tasks::Task;
use image::imageops::FilterType;
use rayon::prelude::*;
use std::path::Path;
use image::ImageFormat;
use tokio::sync::mpsc;
use crate::APP_NAME;

pub async fn task_worker(mut receiver: mpsc::UnboundedReceiver<Task>, db_pool: DbPool) {
    while let Some(task) = receiver.recv().await {
        let conn = &mut db_pool.get().expect("Conn is available");
        match task {
            Task::AddPhotosToDatabase(msg) => {
                println!("Processing message: {}", msg);
            }
            Task::CreatePreviewForPhotos(dir) => {
                create_preview_for_photos(dir, conn).await;
            }
            _ => {}
        }
    }
}

pub async fn create_preview_for_photos(dir: Directory, conn: &mut DbPoolConn) {
    let photos = get_photos_from_directory(conn, dir.id);

    if photos.is_empty() {
        println!("No photos found in directory: {}", dir.path);
        return;
    }

    let local_photo_path = dirs::picture_dir()
        .unwrap_or_else(|| Path::new(".").to_path_buf());

    let output_folder = local_photo_path.join(APP_NAME).join(dir.id.to_string());

    fs::create_dir_all(&output_folder).expect("Failed to create preview directory");

    photos.par_iter().for_each(|photo| {
        let input_path = Path::new(&dir.path).join(&photo.name);
        if !input_path.exists() {
            eprintln!("File not found: {:?}", input_path);
            return;
        }

        let output_path = output_folder.join(format!("{}.preview.{}", photo.id, "avif"));

        match image::open(input_path) {
            Ok(img) => {
                let resized = img.resize(300, 300, FilterType::Lanczos3);
                if let Err(e) = resized.save_with_format(&output_path, ImageFormat::Avif) {
                    eprintln!("Failed to save preview for {}: {}", photo.path, e);
                } else {
                    println!("Preview saved at {:?}", output_path);
                }
            }
            Err(e) => {
                eprintln!("Failed to open image {}: {}", photo.path, e);
            }
        }
    });

    println!("Finished processing previews for directory: {}", dir.path);
}
