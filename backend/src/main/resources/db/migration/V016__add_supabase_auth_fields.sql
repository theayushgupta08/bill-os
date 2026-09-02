-- Add supabase_id to users and make password_hash nullable

ALTER TABLE users
    ADD COLUMN supabase_id UUID UNIQUE,
    ALTER COLUMN password_hash DROP NOT NULL;
