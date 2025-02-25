CREATE TABLE directories (
    id uuid primary key,
    path varchar(512) unique,
    is_imported bool,
    added_time timestamp DEFAULT now()
)