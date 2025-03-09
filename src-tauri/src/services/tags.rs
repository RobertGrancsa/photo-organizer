use crate::db::DbPoolConn;
use crate::schema::{NewPhotoTagMapping, Photo};
use crate::tagging::object_detection::Detection;
use diesel::prelude::*;
use uuid::Uuid;

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
        }
    }

    diesel::insert_into(photo_tags_mappings::table)
        .values(&new_mappings)
        .execute(conn)
}
