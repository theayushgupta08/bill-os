-- Add secondary_phones JSONB column to organizations
ALTER TABLE organizations ADD COLUMN secondary_phones JSONB;

-- Populate missing phones with a dummy value to avoid NOT NULL constraint violation
UPDATE users SET phone = '+91 0000000000' WHERE phone IS NULL OR phone = '';
UPDATE organizations SET phone = '+91 0000000000' WHERE phone IS NULL OR phone = '';

-- Alter phone columns to be NOT NULL
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
ALTER TABLE organizations ALTER COLUMN phone SET NOT NULL;
