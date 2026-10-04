-- Flyway callback: runs after every migrate (including when nothing was pending). Idempotent.
-- Keeps every table in the public schema closed to Supabase's Data API roles, including tables created by
-- migrations written after V028. See V028__revoke_supabase_api_access.sql for the reasoning.

SET LOCAL lock_timeout = '15s';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
        AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
    END IF;
END $$;

DO $$
DECLARE
    t record;
BEGIN
    -- Skip tables that already have it (ALTER TABLE takes an exclusive lock even when nothing changes) and
    -- Flyway's own history table, which Flyway keeps locked on another connection while this runs.
    FOR t IN SELECT tablename FROM pg_tables
             WHERE schemaname = 'public' AND NOT rowsecurity AND tablename <> 'flyway_schema_history' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    END LOOP;
END $$;
