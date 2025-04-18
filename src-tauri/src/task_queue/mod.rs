pub mod tasks;

use crate::task_queue::tasks::Task;
use tokio::sync::mpsc;

#[derive(Debug)]
pub struct TaskQueue {
    sender: mpsc::UnboundedSender<Task>,
}

impl TaskQueue {
    pub fn new() -> (Self, mpsc::UnboundedReceiver<Task>) {
        let (tx, rx) = mpsc::unbounded_channel();
        (Self { sender: tx }, rx)
    }

    pub fn add_task(&self, task: Task) {
        let _ = self.sender.send(task);
    }
}
