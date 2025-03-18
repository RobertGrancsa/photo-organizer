use crate::tagging::task::tagging_task;
use anyhow::Result;
use db_service::db::init_pool;
use db_service::seed::insert_tags_from_yaml;
use ort::execution_providers::{CUDAExecutionProvider, CoreMLExecutionProvider};
use std::thread::sleep;
use std::time::Duration;

pub mod tagging;

pub const APP_NAME: &str = "photo-organizer";

fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    tracing::debug!("Initializing ONNX runtime…");
    ort::init()
        .with_execution_providers([
            CUDAExecutionProvider::default().build(),
            CoreMLExecutionProvider::default().build(),
        ])
        .commit()?;

    let pool = init_pool();

    let conn = &mut pool.get().expect("Can't get DB connection");
    insert_tags_from_yaml(conn, "models/coco.yaml")?;

    println!("Starting tagging task");
    tagging_task(conn)?;
    sleep(Duration::from_secs(1000));
    Ok(())
}
