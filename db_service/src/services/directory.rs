use crate::db::DbPoolConn;
use crate::schema::Directory;
use crate::schema::schema::directories::dsl::directories;
use anyhow::Result;
use diesel::{QueryDsl, RunQueryDsl, SelectableHelper};

pub fn get_directories(conn: &mut DbPoolConn) -> Result<Vec<Directory>> {
    let dirs = directories
        .select(Directory::as_select())
        .load::<Directory>(conn)?;

    Ok(dirs)
}
