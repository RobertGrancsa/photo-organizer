CREATE TABLE exif_metadata (
    id uuid PRIMARY KEY,
    photo_id uuid NOT NULL REFERENCES photos (id) ON DELETE CASCADE,

    -- Basic camera and image info
    make TEXT,                      -- Camera manufacturer
    model TEXT,                     -- Camera model
    orientation INTEGER,            -- Orientation flag
    software TEXT,                  -- Software used

    -- Resolution and dimensions
    x_resolution NUMERIC,           -- Horizontal resolution (can be rational)
    y_resolution NUMERIC,           -- Vertical resolution (can be rational)
    resolution_unit INTEGER,        -- Unit for resolution (inches, cm, etc.)
    pixel_x_dimension INTEGER,      -- Valid width of the image
    pixel_y_dimension INTEGER,      -- Valid height of the image

    -- Date and time information
    date_time TIMESTAMPTZ,          -- Date and time of image modification
    date_time_original TIMESTAMPTZ, -- Original date and time of image creation
    date_time_digitized TIMESTAMPTZ,-- When the image was digitized
    subsec_time TEXT,               -- Fractional seconds for date_time
    subsec_time_original TEXT,      -- Fractional seconds for date_time_original
    subsec_time_digitized TEXT,     -- Fractional seconds for date_time_digitized

    -- Exposure settings
    exposure_time TEXT,             -- Exposure time (may be stored as a fraction)
    f_number NUMERIC,               -- F-stop (aperture)
    exposure_program INTEGER,       -- Exposure program
    iso_speed INTEGER,              -- ISO speed rating
    shutter_speed_value NUMERIC,    -- Shutter speed in APEX units
    aperture_value NUMERIC,         -- Aperture in APEX units
    brightness_value NUMERIC,       -- Brightness
    exposure_bias NUMERIC,          -- Exposure bias
    max_aperture_value NUMERIC,     -- Maximum aperture value
    exposure_mode INTEGER,          -- Exposure mode (auto, manual, etc.)

    -- Metering, flash, and focus
    metering_mode INTEGER,          -- Metering mode
    light_source INTEGER,           -- Light source
    flash INTEGER,                  -- Flash status
    focal_length NUMERIC,           -- Focal length of the lens
    focal_length_in_35mm_film INTEGER, -- Equivalent focal length in 35mm film

    -- Other image attributes
    white_balance INTEGER,          -- White balance setting
    scene_capture_type INTEGER,     -- Scene capture type (landscape, portrait, etc.)
    custom_rendered INTEGER,        -- Custom image processing
    contrast INTEGER,               -- Contrast setting
    saturation INTEGER,             -- Saturation setting
    sharpness INTEGER,              -- Sharpness setting
    gain_control NUMERIC,           -- Gain control

    -- Unique identifier and additional info
    exif_version TEXT,              -- EXIF version
    image_unique_id TEXT,           -- Unique image ID
    components_configuration TEXT,  -- Configuration of color components

    -- GPS information (if available)
    gps_version_id TEXT,            -- GPS tag version
    gps_latitude TEXT,              -- Latitude (could be stored as a string or parsed into numbers)
    gps_longitude TEXT,             -- Longitude
    gps_altitude NUMERIC,           -- Altitude
    gps_timestamp TIMESTAMPTZ,      -- Timestamp for GPS info
    gps_processing_method TEXT,     -- Method used for GPS processing
    gps_date_stamp TEXT,            -- Date stamp for GPS data

   created_at TIMESTAMPTZ DEFAULT now()
);
