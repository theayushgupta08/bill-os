-- Allow phone to be nullable on users table so OAuth signups can provide phone during onboarding
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
