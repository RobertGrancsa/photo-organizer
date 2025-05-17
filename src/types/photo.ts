export interface Photo {
    id: string;
    path: string;
    name: string;
}

export interface PhotoData {
    photos: Photo[];
    tags: string[];
}

export interface PhotoSummary {
    id: string; // UUID
    name: string;
    make?: string | null;
    model?: string | null;
    date_time_original?: string | null; // ISO string or nullable
    width?: number | null;
    height?: number | null;
    iso_speed?: number | null;
    aperture?: number | null;
    shutter_speed?: string | null;
    focal_length?: number | null;
    gps_latitude?: string | null;
    gps_longitude?: string | null;
}
