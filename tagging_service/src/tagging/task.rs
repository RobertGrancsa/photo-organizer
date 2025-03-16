use anyhow::Result;
use db_service::db::DbPoolConn;
use db_service::services::directory::get_directories;
use crate::tagging::object_detection::detect_objects_batch;

pub fn tagging_task(conn: &mut DbPoolConn) -> Result<()>{
    let un_processed_dirs = get_directories(conn)?;

    un_processed_dirs.into_iter().for_each(|dir| {
        let name = dir.path.clone();
        println!("Starting processing of {}", dir.path);
        match detect_objects_batch(String::from("models/yolo11n.torchscript"), dir, conn) {
            Ok(_) => {
                println!("Object detection done for {}!", name);
            }
            Err(err) => {
                eprintln!("Object detection failed for {}: {}", name, err);
            }
        }
    });

    Ok(())
}