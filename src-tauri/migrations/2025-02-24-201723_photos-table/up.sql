CREATE TABLE photos (
    id uuid PRIMARY KEY,
    path uuid NOT NULL REFERENCES directories (id) ON DELETE CASCADE,
    name varchar(255) NOT NULL,
    UNIQUE (path, name)
)