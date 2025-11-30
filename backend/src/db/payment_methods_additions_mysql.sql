-- Consolidated MySQL additions for payment methods
-- This file creates the `payment_methods` table (if missing), ensures the new columns
-- for account details and min_deposit exist, creates an index on bank_id and provides
-- sample seed data. Import this file manually into your MySQL database.

-- NOTE: If your MySQL version is < 8.0 and does not support
-- "ALTER TABLE ... ADD COLUMN IF NOT EXISTS", you should manually verify
-- the columns before running the ALTER statements.

SET @now = NOW();

-- Create table if it does not exist
CREATE TABLE IF NOT EXISTS `payment_methods` (
  `id` CHAR(36) NOT NULL,
  `bank_id` CHAR(36) DEFAULT NULL,
  `code` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) DEFAULT NULL,
  `account_holder_name` VARCHAR(255) DEFAULT NULL,
  `account_number` VARCHAR(100) DEFAULT NULL,
  `min_deposit` DECIMAL(14,2) DEFAULT 0.00,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_methods_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ensure index on bank_id for lookups
CREATE INDEX IF NOT EXISTS `idx_payment_methods_bank_id` ON `payment_methods` (`bank_id`(36));

-- If you already have the table but missing the new columns, try to add them (MySQL 8+)
ALTER TABLE `payment_methods`
  ADD COLUMN IF NOT EXISTS `account_holder_name` VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `account_number` VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `min_deposit` DECIMAL(14,2) DEFAULT 0.00;

-- Sample seed rows (change bank_id values to match your `banks` table)
-- Use fixed UUIDs or generate with UUID() if you prefer non-deterministic ids.
INSERT INTO `payment_methods` (`id`,`bank_id`,`code`,`name`,`account_holder_name`,`account_number`,`min_deposit`,`is_active`,`created_at`,`updated_at`)
VALUES
  (UUID(), NULL, 'BANK_TRANSFER', 'Bank Transfer', 'Company Name', '000111222333', 100.00, 1, @now, @now),
  (UUID(), NULL, 'USDT_TRON', 'USDT (TRC20)', 'Company Crypto', 'TRON_ADDRESS_EXAMPLE', 50.00, 1, @now, @now)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `account_holder_name` = VALUES(`account_holder_name`),
  `account_number` = VALUES(`account_number`),
  `min_deposit` = VALUES(`min_deposit`),
  `is_active` = VALUES(`is_active`),
  `updated_at` = VALUES(`updated_at`);

-- Optional: add foreign key constraint to `banks` when you're ready.
-- Uncomment and adjust if your `banks` table exists and `banks.id` is CHAR(36).
-- ALTER TABLE `payment_methods`
--   ADD CONSTRAINT `fk_payment_methods_bank_id`
--   FOREIGN KEY (`bank_id`) REFERENCES `banks`(`id`) ON DELETE SET NULL;

-- Final note: review inserted `bank_id` values and replace NULL with the correct bank ids
-- from your `banks` table, or insert banks first and then re-run the INSERTs above.
