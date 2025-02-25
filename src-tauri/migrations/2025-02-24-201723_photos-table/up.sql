CREATE TABLE photos (
    id uuid PRIMARY KEY,
    path uuid NOT NULL REFERENCES directories (id),
    name varchar(255) NOT NULL,
    UNIQUE (path, name)
)