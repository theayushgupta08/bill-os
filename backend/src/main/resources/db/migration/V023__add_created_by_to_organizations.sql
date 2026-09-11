-- V023__add_created_by_to_organizations.sql
-- Add created_by column referencing the users table to track organization creator
ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);

-- Backfill created_by for existing organizations from the earliest OWNER in user_org_roles
UPDATE organizations o
SET created_by = sub.user_id
FROM (
    SELECT DISTINCT ON (organization_id) organization_id, user_id
    FROM user_org_roles
    WHERE role = 'OWNER'
    ORDER BY organization_id, created_at ASC
) sub
WHERE o.id = sub.organization_id AND o.created_by IS NULL;

-- Secondary fallback for any organization without an explicit OWNER: pick the earliest member
UPDATE organizations o
SET created_by = sub.user_id
FROM (
    SELECT DISTINCT ON (organization_id) organization_id, user_id
    FROM user_org_roles
    ORDER BY organization_id, created_at ASC
) sub
WHERE o.id = sub.organization_id AND o.created_by IS NULL;
