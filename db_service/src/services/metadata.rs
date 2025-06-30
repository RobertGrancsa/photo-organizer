use crate::db::DbPoolConn;
use crate::schema::schema::{exif_metadata, photos};
use crate::schema::{Directory, ExifMetadata, Photo, PhotoSummary};
use anyhow::Result;
use bigdecimal::FromPrimitive;
use bigdecimal::{BigDecimal, ToPrimitive};
use chrono::NaiveDateTime;
use chrono::Utc;
use diesel::prelude::*;
use exiftool::ExifTool;
use rayon::prelude::*;
use std::path::Path;
use uuid::Uuid;

pub fn save_metadata_from_photos(
    photo_entries: &Vec<Photo>,
    dir: &Directory,
    conn: &mut DbPoolConn,
) -> Result<usize> {
    let exif_entries: Vec<ExifMetadata> = photo_entries
        .par_iter()
        .filter_map(|photo| {
            let mut exiftool = match ExifTool::new() {
                Ok(tool) => tool,
                Err(_) => return None,
            };
            let photo_path = Path::new(&dir.path).join(&photo.name);
            let data = exiftool.json(&photo_path, &[]).ok()?;

            macro_rules! get_str {
                ($k:expr) => {
                    data.get($k).and_then(|v| v.as_str()).map(|s| s.to_string())
                };
            }
            macro_rules! get_i32 {
                ($k:expr) => {
                    data.get($k).and_then(|v| v.as_i64()).map(|i| i as i32)
                };
            }
            macro_rules! get_bd {
                ($k:expr) => {
                    data.get($k)
                        .and_then(|v| v.as_f64())
                        .and_then(|f| BigDecimal::from_f64(f))
                };
            }
            macro_rules! get_dt {
                ($k:expr) => {
                    data.get($k)
                        .and_then(|v| v.as_str())
                        .and_then(|s| NaiveDateTime::parse_from_str(s, "%Y:%m:%d %H:%M:%S").ok())
                };
            }

            Some(ExifMetadata {
                id: Uuid::new_v4(),
                photo_id: photo.id,

                make: get_str!("Make"),
                model: get_str!("Model"),
                orientation: get_i32!("Orientation"),
                software: get_str!("Software"),

                x_resolution: get_bd!("XResolution"),
                y_resolution: get_bd!("YResolution"),
                resolution_unit: get_i32!("ResolutionUnit"),
                pixel_x_dimension: get_i32!("ImageWidth"),
                pixel_y_dimension: get_i32!("ImageHeight"),

                date_time: get_dt!("ModifyDate"),
                date_time_original: get_dt!("DateTimeOriginal"),
                date_time_digitized: get_dt!("CreateDate"),
                subsec_time: get_str!("SubSecTime"),
                subsec_time_original: get_str!("SubSecTimeOriginal"),
                subsec_time_digitized: get_str!("SubSecTimeDigitized"),

                exposure_time: get_str!("ExposureTime"),
                f_number: get_bd!("FNumber"),
                exposure_program: get_i32!("ExposureProgram"),
                iso_speed: get_i32!("ISO"),
                shutter_speed_value: get_bd!("ShutterSpeedValue"),
                aperture_value: get_bd!("ApertureValue"),
                brightness_value: get_bd!("BrightnessValue"),
                exposure_bias: get_bd!("ExposureCompensation"),
                max_aperture_value: get_bd!("MaxApertureValue"),
                exposure_mode: get_i32!("ExposureMode"),

                metering_mode: get_i32!("MeteringMode"),
                light_source: get_i32!("LightSource"),
                flash: get_i32!("Flash"),
                focal_length: get_bd!("FocalLength"),
                focal_length_in_35mm_film: get_i32!("FocalLengthIn35mmFormat"),

                white_balance: get_i32!("WhiteBalance"),
                scene_capture_type: get_i32!("SceneCaptureType"),
                custom_rendered: get_i32!("CustomRendered"),
                contrast: get_i32!("Contrast"),
                saturation: get_i32!("Saturation"),
                sharpness: get_i32!("Sharpness"),
                gain_control: get_bd!("GainControl"),

                exif_version: get_str!("ExifVersion"),
                image_unique_id: get_str!("ImageUniqueID"),
                components_configuration: get_str!("ComponentsConfiguration"),

                gps_version_id: get_str!("GPSVersionID"),
                gps_latitude: get_str!("GPSLatitude"),
                gps_longitude: get_str!("GPSLongitude"),
                gps_altitude: get_bd!("GPSAltitude"),
                gps_timestamp: get_dt!("GPSTimeStamp"),
                gps_processing_method: get_str!("GPSProcessingMethod"),
                gps_date_stamp: get_str!("GPSDateStamp"),

                created_at: Some(Utc::now().naive_utc()),
            })
        })
        .collect();

    if !exif_entries.is_empty() {
        diesel::insert_into(exif_metadata::table)
            .values(&exif_entries)
            .execute(conn)?;
    }

    Ok(exif_entries.len())
}

pub fn get_basic_metadata_for_photos(
    conn: &mut DbPoolConn,
    photo_ids: &[Uuid],
) -> Result<Vec<PhotoSummary>> {
    use crate::schema::schema::exif_metadata::dsl as exif_dsl;
    use crate::schema::schema::photos::dsl as photos_dsl;

    let results = photos::table
        .left_join(exif_metadata::table)
        .filter(photos_dsl::id.eq_any(photo_ids))
        .select((
            photos_dsl::id,
            exif_dsl::make.nullable(),
            exif_dsl::model.nullable(),
            exif_dsl::date_time_original.nullable(),
            exif_dsl::pixel_x_dimension.nullable(),
            exif_dsl::pixel_y_dimension.nullable(),
            exif_dsl::iso_speed.nullable(),
            exif_dsl::f_number.nullable(),
            exif_dsl::exposure_time.nullable(),
            exif_dsl::focal_length.nullable(),
            exif_dsl::gps_latitude.nullable(),
            exif_dsl::gps_longitude.nullable(),
        ))
        .load::<(
            Uuid,
            Option<String>,
            Option<String>,
            Option<NaiveDateTime>,
            Option<i32>,
            Option<i32>,
            Option<i32>,
            Option<BigDecimal>,
            Option<String>,
            Option<BigDecimal>,
            Option<String>,
            Option<String>,
        )>(conn)?
        .into_iter()
        .map(
            |(
                id,
                make,
                model,
                date_time_original,
                width,
                height,
                iso_speed,
                f_number,
                exposure_time,
                focal_length,
                gps_latitude,
                gps_longitude,
            )| {
                PhotoSummary {
                    id,
                    make,
                    model,
                    date_time_original,
                    width,
                    height,
                    iso_speed,
                    aperture: f_number.and_then(|bd| bd.to_f64()),
                    shutter_speed: exposure_time,
                    focal_length: focal_length.and_then(|bd| bd.to_f64()),
                    gps_latitude,
                    gps_longitude,
                }
            },
        )
        .collect();

    Ok(results)
}
