use crate::db::DbPoolConn;
use crate::schema::{NewPhotoTagMapping, Photo};
use diesel::prelude::*;
use uuid::Uuid;

/// A simple detection structure.
#[derive(Debug)]
pub struct Detection {
    pub label: String,
    pub class_idx: usize,
    // pub score: f32,
    // /// Bounding box in the format [x_min, y_min, x_max, y_max]
    // pub bbox: [f32; 4],
}

pub fn insert_photo_tags_mappings(
    conn: &mut DbPoolConn,
    results: Vec<(&Photo, Vec<Detection>)>,
) -> QueryResult<usize> {
    use crate::schema::schema::photo_tags_mappings;
    let mut new_mappings = Vec::new();
    println!("Mapping {} photos", results.len());

    for (photo, detections) in results {
        for detection in detections {
            new_mappings.push(NewPhotoTagMapping {
                id: Uuid::new_v4(),
                tag_id: detection.class_idx as i16,
                photo_id: photo.id,
            });
            println!("Inserting photo mapping {}", detection.class_idx);
        }
    }

    diesel::insert_into(photo_tags_mappings::table)
        .values(&new_mappings)
        .execute(conn)
}
