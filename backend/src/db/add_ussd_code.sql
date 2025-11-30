-- Migration: Add ussd_code column to payment_methods table
-- This allows admin to configure USSD codes for each payment method

ALTER TABLE payment_methods
ADD COLUMN IF NOT EXISTS ussd_code VARCHAR(50);

-- Update existing payment methods with sample USSD codes
UPDATE payment_methods SET ussd_code = '*145#' WHERE code = 'mtm';
UPDATE payment_methods SET ussd_code = '*155#' WHERE code = 'moov';
UPDATE payment_methods SET ussd_code = '*145#' WHERE code = 'tmoney';
UPDATE payment_methods SET ussd_code = '*166#' WHERE code = 'orange';
UPDATE payment_methods SET ussd_code = '*155#' WHERE code = 'wave';

-- Note: USSD code is admin-configurable and displayed to users during payment flow
