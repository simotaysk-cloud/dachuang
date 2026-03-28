-- Expand inspection_records.result to TEXT to accommodate long professional reports
ALTER TABLE inspection_records MODIFY result TEXT NOT NULL;
