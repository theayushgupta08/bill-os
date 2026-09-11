-- Email suffix for auto-generating staff login emails (e.g., "myshop" → @myshop.billos.app)
-- Only set on primary organizations; branches inherit from parent.
-- Globally unique — no two primary organizations can share the same suffix.
ALTER TABLE organizations ADD COLUMN email_suffix VARCHAR(50);
ALTER TABLE organizations ADD CONSTRAINT uq_organizations_email_suffix UNIQUE (email_suffix);

-- Flag for forcing password change on first login (owner-created staff accounts)
ALTER TABLE users ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
