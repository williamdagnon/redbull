-- Consolidated SQL (MySQL-compatible) for recently added tables and related objects
-- File: backend/src/db/recent_tables_combined_mysql.sql
-- Purpose: run this file to create the payment_methods table, seeds, indexes,
-- and add bank_id column (nullable) for MySQL.
-- WARNING: Review and BACKUP your database before running this script.

START TRANSACTION;

-- =====================
-- PAYMENT METHODS (MySQL)
-- =====================

-- Note: uses CHAR(36) UUID strings. Ensure your `banks` table exists and has id CHAR(36).

CREATE TABLE IF NOT EXISTS payment_methods (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  bank_id CHAR(36) DEFAULT NULL,
  account_holder_name VARCHAR(255) DEFAULT NULL,
  account_number VARCHAR(100) DEFAULT NULL,
  min_deposit DECIMAL(14,2) DEFAULT 0.00,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payment_methods_is_active (is_active),
  INDEX idx_payment_methods_bank_id (bank_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default payment methods if they don't exist. We use INSERT IGNORE to skip duplicates.
INSERT IGNORE INTO payment_methods (id, code, name, description) VALUES
(UUID(), 'mtm', 'MTN Mobile Money', 'MTN Mobile Money transfer'),
(UUID(), 'moov', 'MOOV Money', 'MOOV Money transfer'),
(UUID(), 'tmoney', 'Tmoney', 'Tmoney transfer'),
(UUID(), 'orange', 'Orange Money', 'Orange Money transfer'),
(UUID(), 'wave', 'Wave', 'Wave transfer'),
(UUID(), 'bank_transfer', 'Virement bancaire', 'Bank wire transfer');

COMMIT;

-- End of file

-- If you want to enforce a foreign key to `banks(id)` once the `banks` table exists,
-- run the following (uncomment and execute separately after creating `banks`):
--
-- ALTER TABLE payment_methods
--   ADD CONSTRAINT fk_payment_methods_bank FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL;
--
-- Note: ensure `banks.id` has the same type (CHAR(36) if using UUID() ids) before adding the FK.
