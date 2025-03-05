use dotenvy::dotenv;
use std::env;
use diesel::pg::PgConnection;
use diesel::r2d2::{ConnectionManager, Pool, PooledConnection};
pub type DbPool = Pool<ConnectionManager<PgConnection>>;
pub type DbPoolConn = PooledConnection<ConnectionManager<PgConnection>>;

pub fn init_pool() -> DbPool {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let manager = ConnectionManager::<PgConnection>::new(database_url);

    Pool::builder()
        .build(manager)
        .expect("Failed to create pool.")
}
