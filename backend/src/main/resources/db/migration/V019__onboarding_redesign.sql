-- V019__onboarding_redesign.sql
-- Add website column to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website VARCHAR(255);

-- Add component breakdown columns to tax_rates
ALTER TABLE tax_rates ADD COLUMN IF NOT EXISTS cgst_rate DECIMAL(5, 2) DEFAULT 0.00;
ALTER TABLE tax_rates ADD COLUMN IF NOT EXISTS sgst_rate DECIMAL(5, 2) DEFAULT 0.00;
ALTER TABLE tax_rates ADD COLUMN IF NOT EXISTS igst_rate DECIMAL(5, 2) DEFAULT 0.00;
