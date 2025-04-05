use anyhow::Result;
use db_service::db::DbPoolConn;
use db_service::schema::FaceEmbeddingVec;
use db_service::services::embeddings::{assign_clusters, get_all_embeddings};
use linfa::dataset::{DatasetBase, Labels, Records};
use linfa::metrics::SilhouetteScore;
use linfa::traits::Transformer;
use linfa_clustering::Dbscan;
use ndarray_old::{Array1, Array2, Axis};

fn normalize_embeddings(embeddings: &mut Array2<f32>) {
    for mut row in embeddings.axis_iter_mut(Axis(0)) {
        let norm = row.iter().map(|x| x * x).sum::<f32>().sqrt().max(f32::EPSILON);
        row.map_inplace(|x| *x /= norm);
    }
}

pub fn cluster_embeddings(embeddings: &Vec<FaceEmbeddingVec>, min_points: usize) -> Result<Array1<Option<usize>>> {
    // Simulated face embeddings (each row is a 128-dimensional embedding)
    let mut face_embeddings: Array2<f32> = Array2::<f32>::default((embeddings.len(), 128));
    for (i, mut row) in face_embeddings.axis_iter_mut(Axis(0)).enumerate() {
        for (j, col) in row.iter_mut().enumerate() {
            *col = embeddings[i].embedding[j];
        }
    }

    // Normalize embeddings (if not already normalized)
    normalize_embeddings(&mut face_embeddings);

    // Create dataset
    let dataset: DatasetBase<_, _> = DatasetBase::from(face_embeddings.clone());

    // Configure clustering algorithm
    let tolerance = 1.; // Adjust according to the similarity threshold

    tracing::debug!("Clustering {} face embeddings", dataset.nsamples());

    // Apply DBSCAN
    tracing::info!("Running face clustering…");
    let now = std::time::Instant::now();
    let cluster_memberships = Dbscan::params(min_points)
        .tolerance(tolerance)
        .transform(dataset)?;
    tracing::info!("Face clustering took {:?}", now.elapsed());

    let label_count = cluster_memberships.label_count().remove(0);
    tracing::debug!("{:?}", label_count);
    tracing::debug!("{:?}", cluster_memberships.targets);

    tracing::info!("Result:");
    for (label, count) in label_count {
        match label {
            None => tracing::info!(" - {} noise points", count),
            Some(i) => tracing::info!(" - {} points in cluster {}", count, i),
        }
    }

    // Compute silhouette score
    if let Ok(score) = cluster_memberships.silhouette_score() {
        tracing::info!("Silhouette score: {:.4}", score);
    }

    Ok(cluster_memberships.targets)
}

pub fn cluster_faces(conn: &mut DbPoolConn) -> Result<()> {
    let embedding = get_all_embeddings(conn)?;

    let clusters = cluster_embeddings(&embedding, 2)?;

    assign_clusters(embedding, clusters.to_vec(), conn)?;

    Ok(())
}
