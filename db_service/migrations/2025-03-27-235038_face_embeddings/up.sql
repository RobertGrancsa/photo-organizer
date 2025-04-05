CREATE EXTENSION vector;
CREATE TABLE face_embeddings (
    id uuid PRIMARY KEY,
    photo_id uuid NOT NULL REFERENCES photos (id) ON DELETE CASCADE,
    embedding vector(128) NOT NULL,
    cluster_id uuid
);
