CREATE TABLE photos (
    id uuid PRIMARY KEY,
    path uuid REFERENCES directories (id)
)