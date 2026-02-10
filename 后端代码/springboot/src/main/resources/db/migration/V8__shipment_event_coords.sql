-- Add geo coordinates to shipment events for real-time tracking
ALTER TABLE shipment_events ADD COLUMN latitude VARCHAR(32) NULL;
ALTER TABLE shipment_events ADD COLUMN longitude VARCHAR(32) NULL;
