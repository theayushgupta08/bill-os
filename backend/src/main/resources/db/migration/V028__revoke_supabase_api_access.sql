-- billOS reads and writes its tables only through the Spring backend, which connects as the table owner
-- (postgres, BYPASSRLS) and enforces tenant isolation itself. Supabase additionally exposes the public schema
-- through its Data API to the anon and authenticated roles — reachable with the anon key the frontend ships — and by
-- default grants those roles full access to every new table. Close that path so tenant isolation cannot be bypassed:
-- no privileges for anon/authenticated, no default grants for future objects, and row-level security (deny-all,
-- no policies) on every table as a second layer.
--
-- afterMigrate.sql re-applies the revoke + RLS after every migration, so tables added later are covered too.
-- Guarded so the migration also runs on a plain PostgreSQL without Supabase's roles.

SET LOCAL lock_timeout = '15s';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
        AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
        REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

        -- Defaults for objects created by this role (Flyway's) from now on
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
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
