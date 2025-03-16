use std::thread::sleep;
use std::time::Duration;
use db_service::db::init_pool;
use crate::tagging::task::tagging_task;
use anyhow::Result;
use db_service::seed::insert_tags_from_yaml;

pub mod tagging;

pub const APP_NAME: &str = "photo-organizer";

fn main() -> Result<()> {
    let pool = init_pool();

    let conn = &mut pool.get().expect("Can't get DB connection");
    insert_tags_from_yaml(conn, "models/coco.yaml")?;

    println!("Starting tagging task");
    tagging_task(conn)?;
    sleep(Duration::from_secs(1000));
    Ok(())
}
