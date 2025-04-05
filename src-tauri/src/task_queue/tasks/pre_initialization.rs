use crate::task_queue::tasks::Task;
use crate::task_queue::TaskQueue;
use anyhow::Result;
use db_service::db::DbPoolConn;
use db_service::services::directory::get_directories_by_status;
use std::sync::Arc;
use tokio::sync::Mutex;

pub async fn restart_background_processing(
    conn: &mut DbPoolConn,
    queue: Arc<Mutex<TaskQueue>>,
) -> Result<()> {
    let un_processed_dirs = get_directories_by_status(conn, "is_imported", false)?;

    let q = queue.lock().await;

    un_processed_dirs.into_iter().for_each(|d| {
        q.add_task(Task::CreatePreviewForPhotos(d));
    });

    Ok(())
}
