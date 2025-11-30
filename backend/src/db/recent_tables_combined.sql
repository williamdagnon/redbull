-- Consolidated SQL for recently added tables and related objects
-- File: backend/src/db/recent_tables_combined.sql
-- Purpose: run this file to create the payment_methods table, seeds, indexes,
-- triggers and the migration that adds bank_id to payment_methods.
-- WARNING: Review and BACKUP your database before running this script.

BEGIN;

-- Ensure uuid extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Optional: helper update function (safe to recreate)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';


CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  bank_id UUID,
  account_holder_name VARCHAR(255),
  account_number VARCHAR(100),
  min_deposit NUMERIC(14,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default payment methods (id auto-generated) - safe with ON CONFLICT
INSERT INTO payment_methods (code, name, description) VALUES
('mtm', 'MTN Mobile Money', 'MTN Mobile Money transfer'),
('moov', 'MOOV Money', 'MOOV Money transfer'),
('tmoney', 'Tmoney', 'Tmoney transfer'),
('orange', 'Orange Money', 'Orange Money transfer'),
('wave', 'Wave', 'Wave transfer'),
('bank_transfer', 'Virement bancaire', 'Bank wire transfer')
ON CONFLICT (code) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON payment_methods(is_active);

-- Trigger to update updated_at for payment_methods
CREATE TRIGGER IF NOT EXISTS update_payment_methods_updated_at
BEFORE UPDATE ON payment_methods
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- MIGRATION: add bank_id to payment_methods
-- (nullable FK so existing rows are unaffected)
-- =====================

-- Ensure bank_id and new columns exist (safe migration)
ALTER TABLE payment_methods
  ADD COLUMN IF NOT EXISTS bank_id UUID,
  ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS account_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS min_deposit NUMERIC(14,2) DEFAULT 0;

-- If you want to add FK constraint to banks(id) after banks table exists, run separately:
-- ALTER TABLE payment_methods ADD CONSTRAINT fk_payment_methods_bank FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payment_methods_bank_id ON payment_methods(bank_id);

COMMIT;
