use crate::schema::Directory;

pub mod worker;

pub enum Task {
    AddPhotosToDatabase(String),
    CreatePreviewForPhotos(Directory),
    GetPhotoMetadata(String),
}
