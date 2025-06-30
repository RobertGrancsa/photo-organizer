use anyhow::Result;
use db_service::db::DbPoolConn;
use db_service::schema::FaceEmbeddingVec;
use db_service::services::embeddings::{assign_clusters, get_all_embeddings};
use linfa::dataset::{DatasetBase, Labels, Records};
use linfa::metrics::SilhouetteScore;
use linfa::prelude::*;
use linfa::traits::Transformer;
use linfa_clustering::Dbscan;
use linfa_nn::CommonNearestNeighbour;
use linfa_nn::distance::Distance;
use ndarray_old::{Array1, Array2, ArrayView, Axis, Dimension};

/// A custom distance type for Cosine Distance t
/// distance(a, b) = 1 - cos_similarity(a, b)
///               = 1 - (a · b / (||a|| * ||b||))
#[derive(Clone, Copy, Debug)]
pub struct CosineDist;

impl<F: Float> Distance<F> for CosineDist {
    fn distance<D: Dimension>(&self, a: ArrayView<F, D>, b: ArrayView<F, D>) -> F {
        let mut dot = F::zero();
        let mut norm_a = F::zero();
        let mut norm_b = F::zero();

        // Compute dot product and squared norms
        for (&x, &y) in a.iter().zip(b.iter()) {
            dot = dot + x * y;
            norm_a = norm_a + x * x;
            norm_b = norm_b + y * y;
        }

        // Avoid division by zero if either is the zero vector
        if norm_a == F::zero() || norm_b == F::zero() {
            // You might define zero-vector distance differently, but 1.0 is a common choice
            return F::one();
        }

        let norm_a = norm_a.sqrt();
        let norm_b = norm_b.sqrt();
        F::one() - (dot / (norm_a * norm_b))
    }
}

pub fn cluster_embeddings(
    embeddings: &Vec<FaceEmbeddingVec>,
    min_points: usize,
    eps: f32,
) -> Result<Array1<Option<usize>>> {
    // Simulated face embeddings (each row is a 128-dimensional embedding)
    let mut face_embeddings: Array2<f32> = Array2::<f32>::default((embeddings.len(), 128));
    for (i, mut row) in face_embeddings.axis_iter_mut(Axis(0)).enumerate() {
        for (j, col) in row.iter_mut().enumerate() {
            *col = embeddings[i].embedding[j];
        }
    }

    // Create dataset
    let dataset: DatasetBase<_, _> = DatasetBase::from(face_embeddings.clone());

    tracing::debug!("Clustering {} face embeddings", dataset.nsamples());

    // Apply DBSCAN
    tracing::info!("Running face clustering…");
    let now = std::time::Instant::now();
    let cluster_memberships =
        Dbscan::params_with(min_points, CosineDist, CommonNearestNeighbour::LinearSearch)
            .tolerance(eps)
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

    let clusters = cluster_embeddings(&embedding, 2, 0.2)?;

    assign_clusters(embedding, clusters.to_vec(), conn)?;

    Ok(())
}
