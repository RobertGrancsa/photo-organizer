use anyhow::Result;
use db_service::db::DbPoolConn;
use db_service::services::embeddings::get_all_embeddings;
use linfa::dataset::{DatasetBase, Labels, Records};
use linfa::metrics::SilhouetteScore;
use linfa::traits::Transformer;
use linfa_clustering::Dbscan;
use ndarray_old::{Array2, Axis};

pub fn cluster_embeddings(embeddings: Vec<Vec<f32>>, min_points: usize) -> Result<()> {
    // Simulated face embeddings (each row is a 128-dimensional embedding)
    let mut face_embeddings: Array2<f32> = Array2::<f32>::default((embeddings.len(), 128));
    for (i, mut row) in face_embeddings.axis_iter_mut(Axis(0)).enumerate() {
        for (j, col) in row.iter_mut().enumerate() {
            *col = embeddings[i][j];
        }
    }

    // Create dataset
    let dataset: DatasetBase<_, _> = DatasetBase::from(face_embeddings.clone());

    // Configure clustering algorithm
    let tolerance = 4.0; // Adjust according to the similarity threshold

    tracing::debug!("Clustering {} face embeddings", dataset.nsamples());

    // Apply DBSCAN
    tracing::info!("Running face clustering…");
    let now = std::time::Instant::now();
    let cluster_memberships = Dbscan::params(min_points)
        .tolerance(tolerance)
        .transform(dataset)?;
    tracing::info!("Face clustering took {:?}", now.elapsed());

    let label_count = cluster_memberships.label_count().remove(0);
    tracing::debug!("{:?}", cluster_memberships.label_count());
    tracing::debug!("{:?}", label_count);
    tracing::debug!("{:?}", cluster_memberships.records);
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

    // let (records, cluster_memberships) = (cluster_memberships.records, cluster_memberships.targets);

    Ok(())
}

pub fn cluster_faces(conn: &mut DbPoolConn) -> Result<()> {
    let embedding = get_all_embeddings(conn)?;

    cluster_embeddings(embedding, 2)?;

    Ok(())
}
