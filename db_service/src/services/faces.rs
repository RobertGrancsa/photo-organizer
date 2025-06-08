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
) -> Result<HashMap<Uuid, HashMap<Uuid, Vec<Uuid>>>> {
    // Build the base query joining face_embeddings -> photos.
    // We select both face embeddings and the directory ID from photos.
    let mut query = face_embeddings::table
        .inner_join(photos::table.on(photos_dsl::id.eq(face_embeddings::photo_id)))
        .select((face_embeddings::all_columns, photos_dsl::path))
        .into_boxed();

    // Apply filtering if a list of directory IDs is provided.
    if let Some(dirs) = filter_dirs {
        query = query.filter(photos_dsl::path.eq_any(dirs));
    }

    // Execute the query.
    let results = query.load::<(FaceEmbedding, Uuid)>(conn)?;

    tracing::info!("Found {} faces", results.len());

    // Group face embeddings by directory_id and then by cluster_id.
    let mut grouped: HashMap<Uuid, HashMap<Uuid, Vec<Uuid>>> = HashMap::new();

    for (face, directory_id) in results {
        // Get or create the inner map for this directory
        let dir_map = grouped.entry(directory_id).or_default();

        // Get the cluster ID or generate a random one for noise points
        let cluster_id = face.cluster_id.unwrap_or_else(Uuid::new_v4);

        // Add the face ID to the appropriate cluster in this directory
        dir_map.entry(cluster_id).or_default().push(face.id);
    }

    Ok(grouped)
}
