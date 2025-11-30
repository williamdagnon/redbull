-- Migration: require bank_id on payment_methods and add FK (MySQL)
--
-- This script is written to be safe and import-friendly (no DELIMITER / stored procs,
-- no reliance on information_schema privileges). It will:
-- 1) Ensure there is at least one bank (creates a placeholder bank only if `banks` is empty).
-- 2) Create a new table `payment_methods_new` with `bank_id` NOT NULL and FK -> banks(id).
-- 3) Copy all rows from `payment_methods` into `payment_methods_new`, mapping NULL bank_id
--    values to an existing bank (or to the placeholder created in step 1).
-- 4) Rename the tables: keep the old table as `payment_methods_old` and name the new one
--    `payment_methods`. This avoids needing to drop unknown foreign keys on the original table.
--
-- IMPORTANT:
-- - Review and BACK UP your database before running this script.
-- - If other database objects (views, triggers, foreign keys from other tables) reference
--   `payment_methods`, the `RENAME TABLE` step may fail; in that case follow the manual
--   instructions in the comments below (we provide commands to find and drop FK names).
--
-- Run this file from the MySQL CLI or a client that allows multi-statement import.

/* -------------------------------------------------------------------------- */
/* 1) Ensure at least one bank exists (create placeholder only when banks is empty) */
/* -------------------------------------------------------------------------- */

-- Insert a placeholder bank only if the banks table is empty
INSERT INTO banks (id, name, code, country_code, is_active, created_at, updated_at)
SELECT @new_bank_id := UUID(), 'Unassigned', 'UNASSIGNED', NULL, 1, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM banks);

-- Ensure we have a fallback bank id to assign where payment_methods.bank_id IS NULL
SET @fallback_bank_id = (SELECT id FROM banks LIMIT 1);

/* -------------------------------------------------------------------------- */
/* 2) Create the new table payment_methods_new with bank_id NOT NULL + FK        */
/* -------------------------------------------------------------------------- */

CREATE TABLE IF NOT EXISTS payment_methods_new (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  bank_id CHAR(36) NOT NULL,
  account_holder_name VARCHAR(255) DEFAULT NULL,
  account_number VARCHAR(100) DEFAULT NULL,
  min_deposit DECIMAL(14,2) DEFAULT 0.00,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payment_methods_new_is_active (is_active),
  INDEX idx_payment_methods_new_bank_id (bank_id),
  CONSTRAINT fk_payment_methods_new_bank FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* -------------------------------------------------------------------------- */
/* 3) Copy data from payment_methods into payment_methods_new                      */
/*    - any NULL bank_id will be replaced with @fallback_bank_id (first bank id) */
/* -------------------------------------------------------------------------- */

-- If payment_methods doesn't exist, the following INSERT will fail; typically
-- payment_methods exists because earlier migrations create it. If your database
-- does not have a `payment_methods` table, run `recent_tables_combined_mysql.sql` first.

INSERT INTO payment_methods_new (id, name, code, description, bank_id, account_holder_name, account_number, min_deposit, is_active, created_at, updated_at)
SELECT
  id,
  name,
  code,
  description,
  COALESCE(bank_id, @fallback_bank_id),
  account_holder_name,
  account_number,
  min_deposit,
  is_active,
  created_at,
  updated_at
FROM payment_methods;

/* -------------------------------------------------------------------------- */
/* 4) Swap tables: keep old one as payment_methods_old, make new one the live one */
/* -------------------------------------------------------------------------- */

-- Try to rename tables atomically. If this fails because of dependent objects,
-- see the manual recovery section below.
RENAME TABLE payment_methods TO payment_methods_old, payment_methods_new TO payment_methods;

-- Optional: after verification you can drop the old table:
-- DROP TABLE IF EXISTS payment_methods_old;

/* -------------------------------------------------------------------------- */
/* Manual recovery / debugging notes (run only if the RENAME failed)            */
/* -------------------------------------------------------------------------- */
-- 1) Find any foreign keys that reference payment_methods (other tables):
--    SELECT TABLE_NAME, CONSTRAINT_NAME
--    FROM information_schema.KEY_COLUMN_USAGE
--    WHERE REFERENCED_TABLE_NAME = 'payment_methods' AND TABLE_SCHEMA = DATABASE();
--
-- 2) If any FK exists (from other tables), drop those constraints first (ask DBA if needed):
--    ALTER TABLE <other_table> DROP FOREIGN KEY <constraint_name>;
--
-- 3) If a foreign key exists on payment_methods.bank_id (on the OLD table) and you have
--    privilege to drop it, run:
--    ALTER TABLE payment_methods DROP FOREIGN KEY <fk_name>;
--    (you can find <fk_name> with a query against information_schema.KEY_COLUMN_USAGE)
--
-- 4) If you prefer not to rename tables, alternatively:
--    - Ensure payment_methods.bank_id has no NULLs (UPDATE payment_methods SET bank_id = '<valid-id>' WHERE bank_id IS NULL)
--    - Drop the existing FK on payment_methods.bank_id (if any)
--    - Run: ALTER TABLE payment_methods MODIFY COLUMN bank_id CHAR(36) NOT NULL;
--    - Run: ALTER TABLE payment_methods ADD CONSTRAINT fk_payment_methods_bank_id FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE RESTRICT;

/* -------------------------------------------------------------------------- */
/* End of migration                                                               */
/* -------------------------------------------------------------------------- */
