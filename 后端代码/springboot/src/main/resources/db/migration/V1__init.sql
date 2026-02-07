-- Initial schema for demo environment (MySQL 8.x, utf8mb4).
-- Note: this migration assumes the database already exists.

CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NULL,
  updated_at DATETIME(6) NULL,

  username VARCHAR(64) NOT NULL,
  password VARCHAR(100) NOT NULL,
  nickname VARCHAR(64) NULL,
  avatar_url VARCHAR(255) NULL,
  role VARCHAR(32) NOT NULL,
  name VARCHAR(64) NULL,
  phone VARCHAR(32) NULL,
  openid VARCHAR(128) NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username),
  UNIQUE KEY uk_users_openid (openid)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS batches (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NULL,
  updated_at DATETIME(6) NULL,

  batch_no VARCHAR(64) NOT NULL,
  min_code VARCHAR(64) NOT NULL,
  name VARCHAR(128) NULL,
  category VARCHAR(64) NULL,
  origin VARCHAR(128) NULL,
  status VARCHAR(32) NULL,
  description VARCHAR(1000) NULL,
  quantity DECIMAL(19,6) NULL,
  unit VARCHAR(16) NULL,
  gs1_lot_no VARCHAR(32) NULL,
  gs1_code VARCHAR(128) NULL,
  gs1_locked TINYINT(1) NOT NULL DEFAULT 0,

  PRIMARY KEY (id),
  UNIQUE KEY uk_batches_batch_no (batch_no),
  UNIQUE KEY uk_batches_min_code (min_code),
  UNIQUE KEY uk_batches_gs1_lot_no (gs1_lot_no),
  UNIQUE KEY uk_batches_gs1_code (gs1_code),
  KEY idx_batches_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS batch_lineages (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NULL,
  updated_at DATETIME(6) NULL,

  parent_batch_no VARCHAR(64) NOT NULL,
  child_batch_no VARCHAR(64) NOT NULL,
  stage VARCHAR(32) NULL,
  process_type VARCHAR(64) NULL,
  details VARCHAR(1000) NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uk_batch_lineages_child_batch_no (child_batch_no),
  KEY idx_lineage_parent_batch_no (parent_batch_no),
  CONSTRAINT fk_lineage_parent FOREIGN KEY (parent_batch_no) REFERENCES batches(batch_no) ON DELETE RESTRICT,
  CONSTRAINT fk_lineage_child FOREIGN KEY (child_batch_no) REFERENCES batches(batch_no) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS planting_records (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NULL,
  updated_at DATETIME(6) NULL,

  batch_no VARCHAR(64) NOT NULL,
  field_name VARCHAR(128) NULL,
  operation VARCHAR(64) NULL,
  details VARCHAR(1000) NULL,
  operator VARCHAR(64) NULL,
  image_url VARCHAR(255) NULL,
  audio_url VARCHAR(255) NULL,

  PRIMARY KEY (id),
  KEY idx_planting_batch_no (batch_no),
  CONSTRAINT fk_planting_batch FOREIGN KEY (batch_no) REFERENCES batches(batch_no) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS processing_records (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NULL,
  updated_at DATETIME(6) NULL,

  batch_no VARCHAR(64) NOT NULL,
  parent_batch_no VARCHAR(64) NULL,
  process_type VARCHAR(64) NULL,
  factory VARCHAR(128) NULL,
  details VARCHAR(1000) NULL,
  operator VARCHAR(64) NULL,
  image_url VARCHAR(255) NULL,

  PRIMARY KEY (id),
  KEY idx_processing_batch_no (batch_no),
  KEY idx_processing_parent_batch_no (parent_batch_no),
  CONSTRAINT fk_processing_batch FOREIGN KEY (batch_no) REFERENCES batches(batch_no) ON DELETE RESTRICT,
  CONSTRAINT fk_processing_parent_batch FOREIGN KEY (parent_batch_no) REFERENCES batches(batch_no) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inspection_records (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NULL,
  updated_at DATETIME(6) NULL,

  batch_no VARCHAR(64) NOT NULL,
  result VARCHAR(64) NOT NULL,
  report_url VARCHAR(255) NULL,
  inspector VARCHAR(64) NULL,

  PRIMARY KEY (id),
  KEY idx_inspection_batch_no (batch_no),
  CONSTRAINT fk_inspection_batch FOREIGN KEY (batch_no) REFERENCES batches(batch_no) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS logistics_records (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NULL,
  updated_at DATETIME(6) NULL,

  batch_no VARCHAR(64) NOT NULL,
  from_location VARCHAR(128) NULL,
  to_location VARCHAR(128) NULL,
  tracking_no VARCHAR(64) NULL,
  location VARCHAR(128) NULL,
  status VARCHAR(32) NULL,
  update_time DATETIME(6) NULL,

  PRIMARY KEY (id),
  KEY idx_logistics_batch_no (batch_no),
  KEY idx_logistics_tracking_no (tracking_no),
  CONSTRAINT fk_logistics_batch FOREIGN KEY (batch_no) REFERENCES batches(batch_no) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS shipments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NULL,
  updated_at DATETIME(6) NULL,

  shipment_no VARCHAR(64) NOT NULL,
  batch_no VARCHAR(64) NOT NULL,
  distributor_name VARCHAR(128) NOT NULL,
  carrier VARCHAR(64) NULL,
  tracking_no VARCHAR(64) NULL,
  status VARCHAR(32) NULL,
  remarks VARCHAR(1000) NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uk_shipments_shipment_no (shipment_no),
  KEY idx_shipments_batch_no (batch_no),
  KEY idx_shipments_tracking_no (tracking_no),
  CONSTRAINT fk_shipments_batch FOREIGN KEY (batch_no) REFERENCES batches(batch_no) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS shipment_events (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NULL,
  updated_at DATETIME(6) NULL,

  shipment_no VARCHAR(64) NOT NULL,
  event_time DATETIME(6) NOT NULL,
  location VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL,
  details VARCHAR(1000) NULL,

  PRIMARY KEY (id),
  KEY idx_shipment_events_ship_no_time (shipment_no, event_time),
  CONSTRAINT fk_shipment_events_ship FOREIGN KEY (shipment_no) REFERENCES shipments(shipment_no) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS blockchain_records (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NULL,
  updated_at DATETIME(6) NULL,

  batch_no VARCHAR(64) NOT NULL,
  tx_hash VARCHAR(80) NULL,
  data_hash VARCHAR(80) NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uk_blockchain_records_batch_no (batch_no),
  UNIQUE KEY uk_blockchain_records_tx_hash (tx_hash),
  CONSTRAINT fk_blockchain_batch FOREIGN KEY (batch_no) REFERENCES batches(batch_no) ON DELETE RESTRICT
) ENGINE=InnoDB;

