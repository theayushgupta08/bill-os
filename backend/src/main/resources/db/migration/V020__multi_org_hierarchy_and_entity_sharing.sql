-- V020__multi_org_hierarchy_and_entity_sharing.sql
-- Add hierarchy columns to organizations
ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS parent_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS branch_code VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_organizations_parent ON organizations(parent_organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_primary ON organizations(is_primary);

-- Designate existing root organizations as Primary
UPDATE organizations SET is_primary = TRUE WHERE parent_organization_id IS NULL;

-- Add sharing flag to products
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT TRUE;

-- Add sharing and originating org to customers
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS originating_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add sharing flag to collection QR codes
ALTER TABLE collection_qr_codes
    ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT TRUE;

-- Add collecting organization reference to collection payments
ALTER TABLE collection_payments
    ADD COLUMN IF NOT EXISTS collecting_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
