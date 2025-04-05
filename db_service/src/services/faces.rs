use crate::db::DbPoolConn;
use crate::schema::FaceEmbedding;
use crate::schema::schema::photos::dsl as photos_dsl;
use crate::schema::schema::{face_embeddings, photos};
use anyhow::Result;
use diesel::{ExpressionMethods, JoinOnDsl, QueryDsl, RunQueryDsl};
use std::collections::HashMap;
use uuid::Uuid;

/// Fetch all face embeddings and group them by their cluster_id, optionally filtering by directories.
/// Faces with no cluster (noise) are grouped under the None key.
///
/// - `conn`: Database connection.
/// - `filter_directories`: An optional vector of directory names to filter the photos.
pub fn fetch_faces_grouped(
    conn: &mut DbPoolConn,
    filter_dirs: Option<Vec<Uuid>>,
) -> Result<HashMap<Uuid, Vec<Uuid>>> {
    // Build the base query joining face_embeddings -> photos.
    // We select only the columns from face_embeddings.
    let mut query = face_embeddings::table
        .inner_join(photos::table.on(photos_dsl::id.eq(face_embeddings::photo_id)))
        .select(face_embeddings::all_columns)
        .into_boxed();

    // Apply filtering if a list of directory paths is provided.
    if let Some(dirs) = filter_dirs {
        query = query.filter(photos_dsl::path.eq_any(dirs));
    }

    // Execute the query.
    let faces: Vec<FaceEmbedding> = query.load(conn)?;

    tracing::info!("Found {} faces", faces.len());

    // Group face embeddings by cluster_id.
    let mut grouped: HashMap<Uuid, Vec<Uuid>> = HashMap::new();
    for face in faces {
        if let Some(face_cluster) = face.cluster_id {
            grouped.entry(face_cluster).or_default().push(face.id);
        } else {
            grouped.entry(Uuid::new_v4()).or_default().push(face.id);
        }
    }

    Ok(grouped)
}
