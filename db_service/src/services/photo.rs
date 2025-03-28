use crate::db::DbPoolConn;
use crate::schema::schema::photos::dsl::photos as photos_dsl;
use crate::schema::schema::{directories, photos};
use crate::schema::{Directory, Photo};
use diesel::prelude::*;
use diesel::update;
use std::path::Path;
use uuid::Uuid;
use walkdir::WalkDir;
use image::ImageFormat;
use anyhow::Result;

fn is_photo(file_path: &Path) -> bool {
    file_path
        .extension()
        .and_then(|ext| ImageFormat::from_extension(&ext.to_string_lossy().to_lowercase()))
        .is_some()
}

pub fn insert_photos_from_directory(
    conn: &mut DbPoolConn,
    dir: &Directory,
) -> Result<usize> {
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

    diesel::insert_into(photos::table)
        .values(&photo_entries)
        .execute(conn)?;

    use crate::schema::schema::directories::dsl::directories as directories_dsl;

    update(directories_dsl.filter(directories::id.eq(dir.id)))
        .set(directories::photo_count.eq(photo_entries.len() as i32))
        .execute(conn)?;

    tracing::info!("Inserted {} photos into the database.", photo_entries.len());
    Ok(photo_entries.len())
}

pub fn get_photos_from_directory(conn: &mut DbPoolConn, path_uuid: Uuid) -> Vec<Photo> {
    photos_dsl
        .filter(photos::path.eq(&path_uuid))
        .load::<Photo>(conn)
        .unwrap_or_else(|err| {
            tracing::error!("Error retrieving photos: {:?}", err);
            vec![]
        })
}

pub fn get_photos_filtered(
    conn: &mut DbPoolConn,
    path_uuid: Uuid,
    tag_filters: Vec<String>,
) -> QueryResult<Vec<Photo>> {
    use crate::schema::schema::photo_tags_mappings;

    let mut query = photos::table
        .left_outer_join(
            photo_tags_mappings::table.on(photo_tags_mappings::photo_id.eq(photos::id)),
        )
        .filter(photos::path.eq(path_uuid))
        .into_boxed();

    // Only add tag filters if they are provided.
    if !tag_filters.is_empty() {
        query = query.filter(photo_tags_mappings::tag.eq_any(&tag_filters));
    }

    let results = query
        .select(photos::all_columns)
        .order(photos::name)
        .distinct()
        .load::<Photo>(conn)?;

    Ok(results)
}
