use crate::db::DbPoolConn;
use crate::schema::schema::directories::dsl::directories as directories_dsl;
use crate::schema::schema::directories::*;
use crate::schema::{Directory, NewDirectory};
use anyhow::{Result, anyhow};
use diesel::*;
use sha2::{Digest, Sha256};
use uuid::Uuid;

pub fn get_directories(conn: &mut DbPoolConn) -> Result<Vec<Directory>> {
    let dirs = directories_dsl
        .select(Directory::as_select())
        .load::<Directory>(conn)?;

    Ok(dirs)
}

pub fn get_directory_id_by_name(conn: &mut DbPoolConn, path_name: &str) -> Option<Uuid> {
    directories_dsl
        .filter(path.eq(path_name))
        .select(id)
        .first(conn)
        .ok()
}

pub fn insert_directory(conn: &mut DbPoolConn, new_dir: NewDirectory) -> Result<Directory> {
    let directory = insert_into(table)
        .values(&new_dir)
        .returning(Directory::as_returning())
        .get_result(conn)?;

    Ok(directory)
}

pub fn change_directories_status(conn: &mut DbPoolConn, dir_id: &Uuid, column: &str) -> Result<()> {
    let query = update(directories_dsl.filter(id.eq(dir_id))).into_boxed();

    match column {
        "is_imported" => query.set(is_imported.eq(true)).execute(conn)?,
        "is_tagged" => query.set(is_tagged.eq(true)).execute(conn)?,
        "is_face_tagging_done" => query.set(is_face_tagging_done.eq(true)).execute(conn)?,
        _ => return Err(anyhow!("Invalid column name")),
    };

    Ok(())
}

pub fn get_directories_by_status(
    conn: &mut DbPoolConn,
    column: &str,
    status: bool,
) -> Result<Vec<Directory>> {
    let query = match column {
        "is_imported" => directories_dsl
            .filter(is_imported.eq(status))
            .load::<Directory>(conn),
        "is_tagged" => directories_dsl
            .filter(is_tagged.eq(status))
            .filter(is_imported.eq(true))
            .load::<Directory>(conn),
        "is_face_tagging_done" => directories_dsl
            .filter(is_face_tagging_done.eq(status))
            .filter(is_imported.eq(true))
            .load::<Directory>(conn),
        _ => return Err(anyhow!("Invalid column name")),
    }?;

    Ok(query)
}

pub fn delete_directory_from_database(conn: &mut DbPoolConn, dir_id: &Uuid) -> Result<()> {
    let rows_deleted = delete(directories_dsl.filter(id.eq(dir_id)))
        .execute(conn)
        .map_err(|e| anyhow!("Error deleting directory {}: {}", dir_id, e))?;

    if rows_deleted == 0 {
        return Err(anyhow!("No directory found with id: {}", dir_id));
    }

    Ok(())
}

// Helper function to get the latest update timestamp from the directories table
pub fn hash_directories(conn: &mut DbPoolConn) -> Result<String> {
    // Get all (id, is_imported), ordered by id for deterministic hashing
    let items: Vec<(Uuid, bool, bool, bool)> = directories_dsl
        .select((id, is_imported, is_tagged, is_face_tagging_done))
        .order(id.asc())
        .load(conn)?;

    // Serialize to bytes (could be improved to be more compact/precise)
    let mut bytes = Vec::new();
    for (id_value, imported, tagged, face_tagged) in items {
        bytes.extend_from_slice(&id_value.to_bytes_le());
        bytes.push(imported as u8);
        bytes.push(tagged as u8);
        bytes.push(face_tagged as u8);
    }

    // Compute the hash
    let hash = Sha256::digest(&bytes);
    Ok(format!("{:x}", hash))
}
