use crate::db::DbPoolConn;
use crate::schema::schema::photos::dsl::photos;
use crate::schema::{Directory, Photo};
use diesel::prelude::*;
use std::path::Path;
use uuid::Uuid;
use walkdir::WalkDir;

fn is_photo(file_path: &Path) -> bool {
    if let Some(ext) = file_path.extension() {
        match ext.to_string_lossy().to_lowercase().as_str() {
            "jpg" | "jpeg" | "png" | "gif" | "bmp" | "tiff" | "webp" | "heic" => true,
            _ => false,
        }
    } else {
        false
    }
}

pub fn insert_photos_from_directory(conn: &mut DbPoolConn, dir: &Directory) -> Result<(), diesel::result::Error> {
    let photo_entries: Vec<Photo> = WalkDir::new(&dir.path)
        .into_iter()
        .filter_map(|entry| entry.ok()) // Ignore errors
        .filter(|e| e.file_type().is_file() && is_photo(e.path())) // Only take files
        .map(|entry| Photo {
            id: Uuid::new_v4(),
            path: dir.id,
            name: entry.file_name().to_string_lossy().to_string(),
        })
        .collect();

    use crate::schema::schema::photos;
    diesel::insert_into(photos::table)
        .values(&photo_entries)
        .execute(conn)?;

    println!("Inserted {} photos into the database.", photo_entries.len());
    Ok(())
}

pub fn get_photos_from_directory(conn: &mut DbPoolConn, path_uuid: Uuid) -> Vec<Photo> {
    use crate::schema::schema::photos;

    photos.filter(photos::path.eq(&path_uuid)).load::<Photo>(conn).unwrap_or_else(|err| {
        eprintln!("Error retrieving photos: {:?}", err);
        vec![]
    })
}