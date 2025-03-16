CREATE TABLE photo_tags_mappings (
    id uuid PRIMARY KEY,
    tag_id int2 NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
    photo_id uuid NOT NULL REFERENCES photos (id) ON DELETE CASCADE
)
