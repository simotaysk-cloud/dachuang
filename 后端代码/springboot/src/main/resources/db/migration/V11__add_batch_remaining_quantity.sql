-- Idempotent migration for remaining_quantity
SET @has_rem_qty := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'batches' AND column_name = 'remaining_quantity'
);
SET @ddl_v11 := IF(@has_rem_qty = 0, 'ALTER TABLE batches ADD COLUMN remaining_quantity DECIMAL(19, 6) DEFAULT NULL', 'SELECT 1');
PREPARE stmt_v11 FROM @ddl_v11; EXECUTE stmt_v11; DEALLOCATE PREPARE stmt_v11;
