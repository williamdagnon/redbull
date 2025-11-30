-- Migration: add payment_method_id to withdrawals (MySQL)
-- Adds a column to store which payment_method was used for the withdrawal

ALTER TABLE `withdrawals`
  ADD COLUMN IF NOT EXISTS `payment_method_id` CHAR(36) DEFAULT NULL;

-- Optional: populate payment_method_id from existing data if possible.
