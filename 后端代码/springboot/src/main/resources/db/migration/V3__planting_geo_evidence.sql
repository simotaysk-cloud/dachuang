-- Planting record geo trace (minimal) to improve authenticity.

ALTER TABLE planting_records
  ADD COLUMN latitude DOUBLE NULL,
  ADD COLUMN longitude DOUBLE NULL;

