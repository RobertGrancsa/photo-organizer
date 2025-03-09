use diesel::prelude::*;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::db::DbPoolConn;
use crate::schema::Directory;
use crate::schema::schema::directories::dsl::directories;
use crate::task_queue::TaskQueue;
use crate::task_queue::tasks::Task;
use anyhow::Result;

pub async fn restart_background_processing(conn: &mut DbPoolConn, queue: Arc<Mutex<TaskQueue>>) -> Result<()> {
    use crate::schema::schema::directories;

    let un_processed_dirs = directories
        .filter(directories::is_imported.eq(false))
        .load::<Directory>(conn)?;

    let q = queue.lock().await;

    un_processed_dirs.into_iter().for_each(|d| {
        q.add_task(Task::CreatePreviewForPhotos(d));
    });

    Ok(())
}