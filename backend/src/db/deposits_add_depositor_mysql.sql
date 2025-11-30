-- Migration: add depositor_name column to deposits (MySQL)
-- Adds a column to store depositor name for deposit requests

ALTER TABLE `deposits`
  ADD COLUMN IF NOT EXISTS `depositor_name` VARCHAR(255) DEFAULT NULL;
