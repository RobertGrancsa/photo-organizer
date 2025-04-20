use crate::face_clustering::task::{face_clustering_task, face_embeddings_task};
use crate::tagging::task::tagging_task;
use anyhow::Result;
use db_service::db::{DbPoolConn, init_pool};
use db_service::seed::insert_tags_from_yaml;
use db_service::services::directory::hash_directories;
use ort::execution_providers::{
    CPUExecutionProvider, CUDAExecutionProvider, CoreMLExecutionProvider,
};
use std::thread::sleep;
use std::time::Duration;

pub mod face_clustering;
pub mod tagging;

pub const APP_NAME: &str = "photo-organizer";

fn run_tasks(conn: &mut DbPoolConn, first_time: bool) -> Result<()> {
    tracing::info!("Starting tagging task");
    tagging_task(conn)?;

    tracing::info!("Starting face embedding task");
    face_embeddings_task(conn)?;

    if first_time {
        tracing::info!("Starting face clustering task");
        face_clustering_task(conn)?;
    }

    Ok(())
}

fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    tracing::debug!("Initializing ONNX runtime…");
    ort::init()
        .with_execution_providers([
            CUDAExecutionProvider::default().build(),
            CPUExecutionProvider::default().build(),
            CoreMLExecutionProvider::default().build(),
        ])
        .commit()?;

    let pool = init_pool();

    {
        let conn = &mut pool.get().expect("Can't get DB connection");
        insert_tags_from_yaml(conn, "models/coco.yaml")?;
    }

    let mut first_run = true;
    let mut last_seen = String::new();

    loop {
        let conn = &mut pool.get().expect("Can't get DB connection");
        let last_hash = hash_directories(conn)?;

        if last_seen != last_hash {
            tracing::info!("Detected change in directories table, rerunning tasks...");

            if let Err(e) = run_tasks(conn, first_run) {
                tracing::error!("Error running tasks: {}", e);
                continue;
            }

            first_run = false;
            last_seen = last_hash;
        }

        // Poll every 60 seconds; adjust as needed
        sleep(Duration::from_secs(60));
    }
}
