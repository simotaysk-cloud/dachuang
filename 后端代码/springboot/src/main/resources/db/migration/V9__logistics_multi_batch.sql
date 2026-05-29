
DROP TABLE IF EXISTS shipment_items;


CREATE TABLE shipment_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shipment_no VARCHAR(64) NOT NULL,
    batch_no VARCHAR(64) NOT NULL,
    quantity DECIMAL(19, 2),
    unit VARCHAR(32),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_shipment_items_shipment_no (shipment_no),
    INDEX idx_shipment_items_batch_no (batch_no)
);


INSERT INTO shipment_items (shipment_no, batch_no, created_at, updated_at)
SELECT shipment_no, batch_no, created_at, updated_at FROM shipments;



ALTER TABLE shipments DROP FOREIGN KEY fk_shipments_batch;
ALTER TABLE shipments DROP COLUMN batch_no;
