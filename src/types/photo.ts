export interface Photo {
    id: string;
    path: string;
    name: string;
}

export interface PhotoData {
    photos: Photo[];
    tags: string[];
}
