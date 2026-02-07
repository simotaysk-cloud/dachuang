-- Demo-only: reset database schema.
-- Requires a MySQL user with privileges to DROP/CREATE DATABASE and CREATE USER.
--
-- Usage examples:
--   mysql -u root -p < scripts/reset_demo_db.sql
--   mysql -h 127.0.0.1 -P 3306 -u root -p < scripts/reset_demo_db.sql

DROP DATABASE IF EXISTS dachuang;
CREATE DATABASE dachuang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'dachuang'@'%' IDENTIFIED BY 'Dachuang123!';
GRANT ALL PRIVILEGES ON dachuang.* TO 'dachuang'@'%';
FLUSH PRIVILEGES;

