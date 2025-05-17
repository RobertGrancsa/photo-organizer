use bigdecimal::BigDecimal;
use chrono::NaiveDateTime;
use diesel::prelude::*;
use pgvector::Vector;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub mod schema;
pub mod types;

#[derive(Queryable, Selectable, Serialize, Clone)]
#[diesel(table_name = crate::schema::schema::directories)]
#[diesel(check_for_backend(diesel::pg::Pg))]
#[serde(rename_all = "camelCase")]
pub struct Directory {
    pub id: Uuid,
    pub path: String,
    pub is_imported: bool,
    pub added_time: NaiveDateTime,
    pub photo_count: i32,
    pub is_tagged: bool,
    pub is_face_tagging_done: bool,
}

#[derive(Insertable)]
#[diesel(table_name = crate::schema::schema::directories)]
pub struct NewDirectory {
    pub id: Uuid,
    pub path: String,
    pub photo_count: i32,
}

#[derive(Queryable, Selectable, Deserialize, Serialize, Insertable, Clone)]
#[diesel(table_name = crate::schema::schema::photos)]
#[diesel(check_for_backend(diesel::pg::Pg))]
#[serde(rename_all = "camelCase")]
pub struct Photo {
    pub id: Uuid,
    pub path: Uuid,
    pub name: String,
}

// #[derive(Selectable, Deserialize, Serialize)]
// pub struct PhotoWithTags {
//     pub id: Uuid,
//     pub path: Uuid,
//     pub name: String,
//     pub tags: Vec<NewPhotoTagMapping>,
// }

#[derive(Queryable, Selectable, Serialize, Insertable)]
#[diesel(table_name = crate::schema::schema::exif_metadata)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct ExifMetadata {
    pub id: Uuid,
    pub photo_id: Uuid,

    pub make: Option<String>,
    pub model: Option<String>,
    pub orientation: Option<i32>,
    pub software: Option<String>,

    pub x_resolution: Option<BigDecimal>,
    pub y_resolution: Option<BigDecimal>,
    pub resolution_unit: Option<i32>,
    pub pixel_x_dimension: Option<i32>,
    pub pixel_y_dimension: Option<i32>,

    pub date_time: Option<NaiveDateTime>,
    pub date_time_original: Option<NaiveDateTime>,
    pub date_time_digitized: Option<NaiveDateTime>,
    pub subsec_time: Option<String>,
    pub subsec_time_original: Option<String>,
    pub subsec_time_digitized: Option<String>,

    pub exposure_time: Option<String>,
    pub f_number: Option<BigDecimal>,
    pub exposure_program: Option<i32>,
    pub iso_speed: Option<i32>,
    pub shutter_speed_value: Option<BigDecimal>,
    pub aperture_value: Option<BigDecimal>,
    pub brightness_value: Option<BigDecimal>,
    pub exposure_bias: Option<BigDecimal>,
    pub max_aperture_value: Option<BigDecimal>,
    pub exposure_mode: Option<i32>,

    pub metering_mode: Option<i32>,
    pub light_source: Option<i32>,
    pub flash: Option<i32>,
    pub focal_length: Option<BigDecimal>,
    pub focal_length_in_35mm_film: Option<i32>,

    pub white_balance: Option<i32>,
    pub scene_capture_type: Option<i32>,
    pub custom_rendered: Option<i32>,
    pub contrast: Option<i32>,
    pub saturation: Option<i32>,
    pub sharpness: Option<i32>,
    pub gain_control: Option<BigDecimal>,

    pub exif_version: Option<String>,
    pub image_unique_id: Option<String>,
    pub components_configuration: Option<String>,

    pub gps_version_id: Option<String>,
    pub gps_latitude: Option<String>,
    pub gps_longitude: Option<String>,
    pub gps_altitude: Option<BigDecimal>,
    pub gps_timestamp: Option<NaiveDateTime>,
    pub gps_processing_method: Option<String>,
    pub gps_date_stamp: Option<String>,

    pub created_at: Option<NaiveDateTime>,
}

#[derive(Serialize)]
pub struct PhotoSummary {
    pub id: Uuid,
    pub make: Option<String>,
    pub model: Option<String>,
    pub date_time_original: Option<NaiveDateTime>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub iso_speed: Option<i32>,
    pub aperture: Option<f64>,
    pub shutter_speed: Option<String>,
    pub focal_length: Option<f64>,
    pub gps_latitude: Option<String>,
    pub gps_longitude: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Folders {
    pub name: String,
}

#[derive(Insertable, Serialize, Deserialize)]
#[diesel(table_name = crate::schema::schema::photo_tags_mappings)]
pub struct NewPhotoTagMapping {
    pub id: Uuid,
    pub tag: String,
    pub photo_id: Uuid,
}

#[derive(Insertable, Deserialize, Selectable)]
#[diesel(table_name = crate::schema::schema::tags)]
pub struct Tag {
    pub id: i16,
    pub tag: String,
}

#[derive(Insertable, Queryable, Selectable)]
#[diesel(table_name = crate::schema::schema::face_embeddings)]
pub struct FaceEmbedding {
    pub id: Uuid,
    pub photo_id: Uuid,
    pub embedding: Vector,
    pub cluster_id: Option<Uuid>,
}

#[derive(Queryable, Selectable)]
#[diesel(table_name = crate::schema::schema::face_embeddings)]
pub struct FaceEmbeddingVec {
    pub id: Uuid,
    pub photo_id: Uuid,
    pub embedding: Vec<f32>,
}

#[derive(Insertable)]
#[diesel(table_name = crate::schema::schema::clusters)]
pub struct NewCluster {
    pub id: Uuid,
    pub name: Option<String>,
}

// Updatable struct for the face_embeddings table.
#[derive(AsChangeset)]
#[diesel(table_name = crate::schema::schema::face_embeddings)]
pub struct FaceEmbeddingClusterUpdate {
    pub cluster_id: Option<Uuid>,
}
