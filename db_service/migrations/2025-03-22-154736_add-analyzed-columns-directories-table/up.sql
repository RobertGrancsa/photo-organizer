ALTER TABLE directories
    ADD COLUMN is_tagged BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN is_face_tagging_done BOOLEAN NOT NULL DEFAULT false;