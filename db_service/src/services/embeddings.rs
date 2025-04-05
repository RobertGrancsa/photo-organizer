use crate::db::DbPoolConn;
use crate::schema::schema::face_embeddings;
use crate::schema::schema::face_embeddings::dsl::face_embeddings as face_dsl;
use crate::schema::{
    FaceEmbedding, FaceEmbeddingClusterUpdate, FaceEmbeddingVec, NewCluster, Photo,
};
use anyhow::Result;
use diesel::*;
use pgvector::Vector;
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

pub fn add_embeddings(
    conn: &mut DbPoolConn,
    embeddings: Vec<(&Photo, Vec<Uuid>, Vec<Vec<f32>>)>,
) -> Result<()> {
    // Map the incoming embeddings to our insertable struct
    let new_embeddings: Vec<FaceEmbedding> = embeddings
        .into_iter()
        .flat_map(|(photo, ids, emb_list)| {
            emb_list
                .into_iter()
                .zip(ids.into_iter())
                .map(move |(emb, id)| FaceEmbedding {
                    id,
                    photo_id: photo.id,
                    embedding: Vector::from(emb),
                    cluster_id: None,
                })
        })
        .collect();

    // Insert all rows into the face_embeddings table
    insert_into(face_embeddings::table)
        .values(&new_embeddings)
        .execute(conn)?;

    Ok(())
}

pub fn get_all_embeddings(conn: &mut DbPoolConn) -> Result<Vec<FaceEmbeddingVec>> {
    Ok(face_dsl
        .select(FaceEmbedding::as_select())
        .load::<FaceEmbedding>(conn)?
        .into_iter()
        .map(|face| FaceEmbeddingVec {
            id: face.id,
            photo_id: face.photo_id,
            embedding: face.embedding.to_vec(),
        })
        .collect())
}

/// Assign clusters based on DBSCAN results and update the face embeddings accordingly.
/// - `embeddings`: a vector of face embedding records.
/// - `cluster_labels`: an Array1 of Option<usize> produced by DBSCAN where each label corresponds to an embedding.
///   Noise points are represented as `None`.
pub fn assign_clusters(
    embeddings: Vec<FaceEmbeddingVec>,
    cluster_labels: Vec<Option<usize>>,
    conn: &mut DbPoolConn,
) -> Result<()> {
    // Use the clusters table DSL.
    use crate::schema::schema::clusters::dsl as cl_dsl;
    use crate::schema::schema::face_embeddings::dsl as fe_dsl;

    // Collect unique cluster labels from the DBSCAN results (skip noise points).
    let unique_cluster_ids: HashSet<usize> =
        cluster_labels.iter().filter_map(|&label| label).collect();

    // Create a mapping from DBSCAN cluster label (usize) to a newly generated UUID.
    let mut cluster_id_mapping: HashMap<usize, Uuid> = HashMap::new();

    // Collect new clusters in a vector.
    let mut new_clusters = Vec::new();
    for label in unique_cluster_ids {
        let new_uuid = Uuid::new_v4();
        cluster_id_mapping.insert(label, new_uuid);

        new_clusters.push(NewCluster {
            id: new_uuid,
            name: None,
        });
    }

    // Batch insert all new clusters at once.
    insert_into(cl_dsl::clusters)
        .values(&new_clusters)
        .execute(conn)?;

    // Now update each face embedding with the corresponding cluster UUID.
    // Note: we assume that `embeddings` and `cluster_labels` are in the same order.
    for (face, label_option) in embeddings.into_iter().zip(cluster_labels.iter()) {
        let update_value = match label_option {
            // Map the DBSCAN label to the corresponding cluster UUID.
            Some(label) => Some(*cluster_id_mapping.get(label).expect("Cluster should exist")),
            // For noise points, set the cluster_id to None.
            None => None,
        };

        if update_value.is_none() {
            continue;
        }

        let update_data = FaceEmbeddingClusterUpdate {
            cluster_id: update_value,
        };

        update(fe_dsl::face_embeddings.filter(fe_dsl::id.eq(face.id)))
            .set(&update_data)
            .execute(conn)?;
    }

    Ok(())
}
