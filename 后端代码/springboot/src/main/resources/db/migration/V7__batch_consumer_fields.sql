-- Add consumer-facing fields for batches used by trace/consumer UI.
-- Use information_schema checks to keep migration rerunnable.

SET @has_image_url := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'batches' AND column_name = 'image_url'
);
SET @ddl := IF(@has_image_url = 0, 'ALTER TABLE batches ADD COLUMN image_url VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_usage_advice := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'batches' AND column_name = 'usage_advice'
);
SET @ddl := IF(@has_usage_advice = 0, 'ALTER TABLE batches ADD COLUMN usage_advice VARCHAR(1000) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_contra := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'batches' AND column_name = 'contraindications'
);
SET @ddl := IF(@has_contra = 0, 'ALTER TABLE batches ADD COLUMN contraindications VARCHAR(1000) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_pairings := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'batches' AND column_name = 'common_pairings'
);
SET @ddl := IF(@has_pairings = 0, 'ALTER TABLE batches ADD COLUMN common_pairings VARCHAR(1000) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

