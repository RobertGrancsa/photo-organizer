use db_service::schema::Photo;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PhotoData {
    pub photos: Vec<Photo>,
    pub tags: Vec<String>,
}
