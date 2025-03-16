use db_service::schema::Directory;

pub mod worker;
pub mod pre_initialization;

pub enum Task {
    AddPhotosToDatabase(String),
    CreatePreviewForPhotos(Directory),
    GetPhotoMetadata(String),
    DetectObjectsFromPhotos(Directory, String),
}
