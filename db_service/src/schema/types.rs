use uuid::Uuid;

pub struct ProcessedPhoto {
    pub id: Uuid,
    pub path: Uuid,
    pub name: String,
    pub has_preview: bool,
}
