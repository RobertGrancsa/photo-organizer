use crate::db::DbPoolConn;
use crate::schema::Tag;
use anyhow::Result;
use diesel::prelude::*;
use serde::Deserialize;
use std::collections::HashMap;
use std::fs;

#[derive(Deserialize)]
pub struct DatasetYaml {
    names: HashMap<u32, String>,
}

pub fn insert_tags_from_yaml(conn: &mut DbPoolConn, yaml_path: &str) -> Result<()> {
    use crate::schema::schema::tags::dsl::*;
    tracing::info!("Inserting tags into yaml");

    let count: i64 = tags.count().get_result(conn)?;
    if count > 0 {
        tracing::info!("Tags table already populated. Skipping...");
        return Ok(());
    }

    let yaml_str = fs::read_to_string(yaml_path)?;
    let dataset: DatasetYaml = serde_yaml::from_str(&yaml_str)?;

    for (id_value, tag_value) in dataset.names {
        diesel::insert_into(tags)
            .values(&Tag {
                id: id_value as i16,
                tag: tag_value,
            })
            .execute(conn)?;
    }

    Ok(())
}
