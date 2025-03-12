CREATE TABLE directories (
    id uuid primary key,
    path varchar(512) NOT NULL UNIQUE,
    is_imported bool NOT NULL DEFAULT false,
    added_time timestamp NOT NULL DEFAULT now(),
    photo_count int4 NOT NULL DEFAULT 0
)