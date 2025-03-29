use anyhow::Result;
use ndarray::{Array, Array2};

pub fn process_embeddings(embeddings: Vec<Vec<f32>>) -> Result<()> {
    let embedding_dim = embeddings[0].len();
    let n_samples = embeddings.len();
    let mut data = Array2::<f32>::zeros((n_samples, embedding_dim));
    for (i, emb) in embeddings.iter().enumerate() {
        data.row_mut(i).assign(&Array::from(emb.clone()));
    }

    // Run DBSCAN clustering on the embeddings.
    // The parameters here (eps and min_points) may need adjustment based on your data.
    // let dbscan = Dbscan::params(3) // epsilon: max distance between points in a cluster
    //     .fit(&data)?;
    //
    // match dbscan {
    //     Ok(model) => {
    //         println!("Cluster labels: {:?}", model.labels);
    //         // Optionally, print each image path with its cluster label
    //         for (i, label) in model.labels.iter().enumerate() {
    //             println!("Image {:?} assigned to cluster {:?}", i, label);
    //         }
    //     },
    //     Err(err) => {
    //         println!("Clustering error: {:?}", err);
    //     },
    // }

    Ok(())
}