CREATE TABLE photo_tags_mappings (
    id uuid PRIMARY KEY,
    tag varchar(255) NOT NULL REFERENCES tags (tag) ON DELETE CASCADE,
    photo_id uuid NOT NULL REFERENCES photos (id) ON DELETE CASCADE,
    UNIQUE (tag, photo_id)
)
