import os
import re
import sys
import argparse
from pathlib import Path

# Try importing psycopg
try:
    import psycopg
except ImportError:
    print("Error: psycopg is not installed in the active environment.")
    print("Please run this script using .\\ai-service\\.venv\\Scripts\\python scripts/reset_db.py")
    sys.exit(1)


def load_backend_env():
    """Load database credentials from backend/.env if not in environment."""
    env_path = Path(__file__).resolve().parent.parent / "backend" / ".env"
    env_vars = {}
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env_vars[k.strip()] = v.strip()
    return env_vars


def get_connection_params():
    env_vars = load_backend_env()

    db_url = os.environ.get("SPRING_DATASOURCE_URL") or env_vars.get("SPRING_DATASOURCE_URL")
    user = os.environ.get("SPRING_DATASOURCE_USERNAME") or env_vars.get("SPRING_DATASOURCE_USERNAME")
    password = os.environ.get("SPRING_DATASOURCE_PASSWORD") or env_vars.get("SPRING_DATASOURCE_PASSWORD")

    if not db_url:
        raise ValueError("Could not find SPRING_DATASOURCE_URL in environment or backend/.env")

    # Parse JDBC URL: jdbc:postgresql://host:port/dbname?params
    clean_url = db_url.replace("jdbc:", "")
    m = re.search(r"postgresql://([^:/]+)(?::(\d+))?/([^?]+)", clean_url)
    if not m:
        raise ValueError(f"Failed to parse database connection URL: {db_url}")

    host = m.group(1)
    port = int(m.group(2)) if m.group(2) else 5432
    dbname = m.group(3)

    return {
        "host": host,
        "port": port,
        "dbname": dbname,
        "user": user,
        "password": password,
    }


def reset_database(force=False):
    params = get_connection_params()

    print("=" * 60)
    print(" billOS Database Reset Utility")
    print("=" * 60)
    print(f"Target Database: {params['dbname']} on {params['host']}:{params['port']}")
    print(f"Target User:     {params['user']}")
    print("=" * 60)

    if not force:
        confirm = input("\nWARNING: This will purge all application data and auth users! Continue? [y/N]: ")
        if confirm.strip().lower() not in ("y", "yes"):
            print("Aborted.")
            sys.exit(0)

    print("\nConnecting to database...")
    with psycopg.connect(**params, autocommit=True) as conn:
        with conn.cursor() as cur:
            # 1. Truncate all public tables except flyway_schema_history
            print("1. Fetching public application tables...")
            cur.execute("""
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public' AND tablename != 'flyway_schema_history'
                ORDER BY tablename;
            """)
            public_tables = [row[0] for row in cur.fetchall()]
            print(f"   Found {len(public_tables)} public tables.")

            if public_tables:
                print("2. Truncating public tables with CASCADE...")
                table_list_str = ", ".join([f'public."{t}"' for t in public_tables])
                cur.execute(f"TRUNCATE TABLE {table_list_str} CASCADE;")
                print("   Public tables successfully truncated.")

            # 2. Delete from auth.users (Supabase Auth)
            print("3. Checking Supabase auth schema...")
            cur.execute("""
                SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users';
            """)
            auth_exists = cur.fetchone() is not None

            if auth_exists:
                print("4. Purging auth.users in Supabase (cascades to identities/sessions)...")
                cur.execute("DELETE FROM auth.users;")
                print("   Supabase auth users purged.")

            # 3. Verification checks
            print("\n" + "=" * 60)
            print(" Verification:")
            print("=" * 60)

            cur.execute("SELECT count(*) FROM public.organizations;")
            org_count = cur.fetchone()[0]
            print(f" - public.organizations count: {org_count}")

            cur.execute("SELECT count(*) FROM public.users;")
            user_count = cur.fetchone()[0]
            print(f" - public.users count:         {user_count}")

            if auth_exists:
                cur.execute("SELECT count(*) FROM auth.users;")
                auth_count = cur.fetchone()[0]
                print(f" - auth.users count:           {auth_count}")

            cur.execute("SELECT count(*) FROM public.flyway_schema_history;")
            flyway_count = cur.fetchone()[0]
            print(f" - flyway_schema_history:      {flyway_count} migrations preserved")

    print("\nDatabase reset complete! You can now create a new account from scratch.")
    print("Tip: Clear localStorage (or use an Incognito tab) to clear any cached sessions.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reset billOS database for fresh onboarding testing.")
    parser.add_argument("--force", "-f", action="store_true", help="Bypass confirmation prompt")
    args = parser.parse_args()

    reset_database(force=args.force)
