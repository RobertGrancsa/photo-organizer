use crate::db::DbPoolConn;
use crate::schema::{NewPhotoTagMapping, Photo};
use anyhow::Result;
use diesel::prelude::*;
use std::collections::HashSet;
use uuid::Uuid;

/// A simple detection structure.
#[derive(Debug, PartialEq, Eq, Hash)]
pub struct Detection {
    pub label: String,
    // pub class_idx: usize,
    // pub score: f32,
    // /// Bounding box in the format [x_min, y_min, x_max, y_max]
    // pub bbox: [f32; 4],
}

pub fn insert_photo_tags_mappings(
    conn: &mut DbPoolConn,
    results: Vec<(&Photo, HashSet<Detection>)>,
) -> QueryResult<usize> {
    use crate::schema::schema::photo_tags_mappings;

    let mut new_mappings = Vec::new();
    tracing::info!("Mapping {} photos", results.len());

    for (photo, detections) in results {
        for detection in detections {
            new_mappings.push(NewPhotoTagMapping {
                id: Uuid::new_v4(),
                tag: detection.label,
                photo_id: photo.id,
            });
        }
    }

    diesel::insert_into(photo_tags_mappings::table)
        .values(&new_mappings)
        .execute(conn)
}

pub fn get_unique_filters(conn: &mut DbPoolConn, path_uuid: Option<Uuid>) -> Result<Vec<String>> {
    use crate::schema::schema::{photo_tags_mappings, photos};

    // Start with the base query
    let mut query = photo_tags_mappings::table
        .inner_join(photos::table.on(photos::id.eq(photo_tags_mappings::photo_id)))
        .into_boxed();

    // Apply path filter only if path_uuid is provided
    if let Some(path_id) = path_uuid {
        query = query.filter(photos::path.eq(path_id));
    }

    // Execute the query with common operations
    let results = query
        .select(photo_tags_mappings::tag)
        .distinct()
        .order_by(photo_tags_mappings::tag)
        .load::<String>(conn)?;

    Ok(results)
}
