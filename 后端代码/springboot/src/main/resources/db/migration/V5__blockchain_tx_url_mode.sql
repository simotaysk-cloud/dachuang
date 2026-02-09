-- Store extra info for real blockchain anchoring (optional).

ALTER TABLE blockchain_records ADD COLUMN mode VARCHAR(16) NULL;
ALTER TABLE blockchain_records ADD COLUMN tx_url VARCHAR(255) NULL;

