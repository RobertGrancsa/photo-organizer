use crate::db::DbPool;
use crate::schema::schema::directories::dsl::directories;
use crate::schema::{Directory, NewDirectory, Photo};
use crate::services::photo::insert_photos_from_directory;

use diesel::prelude::*;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_folders(pool: State<DbPool>) -> Vec<Directory> {
    let conn = &mut pool.get().expect("Should be connected to the db");

    directories.select(Directory::as_select()).load::<Directory>(conn).expect("We have files")
}

#[tauri::command]
pub fn add_folder(pool: State<DbPool>, path: &str) -> Directory {
    use crate::schema::schema::directories;
    let conn = &mut pool.get().expect("Should be connected to the db");

    let new_dir = NewDirectory { id: Uuid::new_v4(), path: String::from(path) };

    let dir_record = diesel::insert_into(directories::table)
        .values(&new_dir)
        .returning(Directory::as_returning())
        .get_result(conn)
        .expect("Error saving dir");

    insert_photos_from_directory(conn, &dir_record).expect("Should be able to insert");

    dir_record
}

#[tauri::command]
pub fn get_photos_from_path(pool: State<DbPool>, path: &str) -> Vec<Photo> {
    let conn = &mut pool.get().expect("Should be connected to the db");

    vec![]
}