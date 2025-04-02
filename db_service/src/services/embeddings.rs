use diesel::{QueryDsl, RunQueryDsl};
use uuid::Uuid;
use crate::db::DbPoolConn;
use crate::schema::{FaceEmbedding, Photo};
use crate::schema::schema::face_embeddings;
use pgvector::Vector;
use crate::schema::schema::face_embeddings::dsl::face_embeddings as face_dsl;
use anyhow::Result;

pub fn add_embeddings(conn: &mut DbPoolConn, embeddings: Vec<(&Photo, Vec<Uuid>, Vec<Vec<f32>>)>) -> Result<()> {
    // Map the incoming embeddings to our insertable struct
    let new_embeddings: Vec<FaceEmbedding> = embeddings
        .into_iter()
        .flat_map(|(photo, ids, emb_list)| {
            emb_list.into_iter().zip(ids.into_iter()).map(move |(emb, id)| FaceEmbedding {
                id,
                photo_id: photo.id,
                embedding: Vector::from(emb),
            })
        })
        .collect();

    // Insert all rows into the face_embeddings table
    diesel::insert_into(face_embeddings::table)
        .values(&new_embeddings)
        .execute(conn)?;

    Ok(())
}

pub fn get_all_embeddings(conn: &mut DbPoolConn) -> Result<Vec<Vec<f32>>> {
    Ok(face_dsl
        .select(face_embeddings::embedding)
        .load::<Vector>(conn)?
        .into_iter()
        .map(|emb| emb.to_vec())
        .collect::<Vec<Vec<f32>>>())
}