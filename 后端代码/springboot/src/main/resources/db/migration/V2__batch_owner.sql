-- Add ownership for batches (who created/owns the batch).
-- Demo-friendly: allow NULL for existing rows; application will always set it on create/derive.

ALTER TABLE batches
  ADD COLUMN owner_user_id BIGINT NULL;

CREATE INDEX idx_batches_owner_user_id ON batches(owner_user_id);

ALTER TABLE batches
  ADD CONSTRAINT fk_batches_owner_user
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
  ON DELETE RESTRICT;

