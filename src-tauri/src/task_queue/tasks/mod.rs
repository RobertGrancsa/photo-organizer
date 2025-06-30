use db_service::schema::Directory;

pub mod pre_initialization;
pub mod worker;

pub enum Task {
    AddPhotosToDatabase(String),
    CreatePreviewForPhotos(Directory),
    GetPhotoMetadata(String),
    DetectObjectsFromPhotos(Directory, String),
}
