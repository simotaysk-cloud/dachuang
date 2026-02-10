-- Add production line name for processing records.
-- Use dynamic SQL to make it safe to run even if the column already exists.

SET @has_line_name := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'processing_records'
    AND column_name = 'line_name'
);

SET @ddl := IF(
  @has_line_name = 0,
  'ALTER TABLE processing_records ADD COLUMN line_name VARCHAR(64) NULL',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
