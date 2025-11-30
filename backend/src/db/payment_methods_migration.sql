-- Migration: make payment_methods reference banks
-- File: backend/src/db/payment_methods_migration.sql

-- Add bank_id column to payment_methods if it does not exist
ALTER TABLE payment_methods
ADD COLUMN IF NOT EXISTS bank_id UUID REFERENCES banks(id) ON DELETE SET NULL;

-- Create index to speed queries by bank
CREATE INDEX IF NOT EXISTS idx_payment_methods_bank_id ON payment_methods(bank_id);

-- Note: Seed data kept without bank associations. Admin can assign bank_id via API.

-- To set bank_id for existing methods that represent bank transfers, run an update like:
-- UPDATE payment_methods SET bank_id = '<bank-uuid>' WHERE code = 'bank_transfer';
