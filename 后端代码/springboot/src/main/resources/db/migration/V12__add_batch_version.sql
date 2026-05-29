
SET @has_version := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'batches' AND column_name = 'version'
);
SET @ddl_v12 := IF(@has_version = 0, 'ALTER TABLE batches ADD COLUMN version INT NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt_v12 FROM @ddl_v12; EXECUTE stmt_v12; DEALLOCATE PREPARE stmt_v12;
