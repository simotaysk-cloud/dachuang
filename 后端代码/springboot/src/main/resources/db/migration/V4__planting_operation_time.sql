-- Record the actual operation time for planting actions.
-- For demo: backfill existing rows, then enforce NOT NULL.

ALTER TABLE planting_records
  ADD COLUMN operation_time DATETIME(6) NULL;

UPDATE planting_records
  SET operation_time = COALESCE(operation_time, created_at, NOW(6))
  WHERE operation_time IS NULL;

ALTER TABLE planting_records
  MODIFY COLUMN operation_time DATETIME(6) NOT NULL;

