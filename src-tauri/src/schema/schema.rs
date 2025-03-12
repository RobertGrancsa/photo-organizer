// @generated automatically by Diesel CLI.

diesel::table! {
    directories (id) {
        id -> Uuid,
        #[max_length = 512]
        path -> Varchar,
        is_imported -> Bool,
        added_time -> Timestamp,
        photo_count -> Int4,
    }
}

diesel::table! {
    exif_metadata (id) {
        id -> Uuid,
        photo_id -> Uuid,
        make -> Nullable<Text>,
        model -> Nullable<Text>,
        orientation -> Nullable<Int4>,
        software -> Nullable<Text>,
        x_resolution -> Nullable<Numeric>,
        y_resolution -> Nullable<Numeric>,
        resolution_unit -> Nullable<Int4>,
        pixel_x_dimension -> Nullable<Int4>,
        pixel_y_dimension -> Nullable<Int4>,
        date_time -> Nullable<Timestamptz>,
        date_time_original -> Nullable<Timestamptz>,
        date_time_digitized -> Nullable<Timestamptz>,
        subsec_time -> Nullable<Text>,
        subsec_time_original -> Nullable<Text>,
        subsec_time_digitized -> Nullable<Text>,
        exposure_time -> Nullable<Text>,
        f_number -> Nullable<Numeric>,
        exposure_program -> Nullable<Int4>,
        iso_speed -> Nullable<Int4>,
        shutter_speed_value -> Nullable<Numeric>,
        aperture_value -> Nullable<Numeric>,
        brightness_value -> Nullable<Numeric>,
        exposure_bias -> Nullable<Numeric>,
        max_aperture_value -> Nullable<Numeric>,
        exposure_mode -> Nullable<Int4>,
        metering_mode -> Nullable<Int4>,
        light_source -> Nullable<Int4>,
        flash -> Nullable<Int4>,
        focal_length -> Nullable<Numeric>,
        focal_length_in_35mm_film -> Nullable<Int4>,
        white_balance -> Nullable<Int4>,
        scene_capture_type -> Nullable<Int4>,
        custom_rendered -> Nullable<Int4>,
        contrast -> Nullable<Int4>,
        saturation -> Nullable<Int4>,
        sharpness -> Nullable<Int4>,
        gain_control -> Nullable<Numeric>,
        exif_version -> Nullable<Text>,
        image_unique_id -> Nullable<Text>,
        components_configuration -> Nullable<Text>,
        gps_version_id -> Nullable<Text>,
        gps_latitude -> Nullable<Text>,
        gps_longitude -> Nullable<Text>,
        gps_altitude -> Nullable<Numeric>,
        gps_timestamp -> Nullable<Timestamptz>,
        gps_processing_method -> Nullable<Text>,
        gps_date_stamp -> Nullable<Text>,
        created_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    photo_tags_mappings (id) {
        id -> Uuid,
        tag_id -> Int2,
        photo_id -> Uuid,
    }
}

diesel::table! {
    photos (id) {
        id -> Uuid,
        path -> Uuid,
        #[max_length = 255]
        name -> Varchar,
    }
}

diesel::table! {
    tags (id) {
        id -> Int2,
        #[max_length = 255]
        tag -> Varchar,
    }
}

diesel::joinable!(exif_metadata -> photos (photo_id));
diesel::joinable!(photo_tags_mappings -> photos (photo_id));
diesel::joinable!(photo_tags_mappings -> tags (tag_id));
diesel::joinable!(photos -> directories (path));

diesel::allow_tables_to_appear_in_same_query!(
    directories,
    exif_metadata,
    photo_tags_mappings,
    photos,
    tags,
);
