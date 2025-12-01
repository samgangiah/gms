#!/bin/bash
set -e

# This script is run by docker-entrypoint-initdb.d
# POSTGRES_PASSWORD is already set as environment variable

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create required database users
    CREATE USER supabase_auth_admin WITH PASSWORD '$POSTGRES_PASSWORD';
    CREATE USER authenticator WITH PASSWORD '$POSTGRES_PASSWORD';
    CREATE USER supabase_storage_admin WITH PASSWORD '$POSTGRES_PASSWORD';
    CREATE USER dashboard_user WITH PASSWORD '$POSTGRES_PASSWORD';

    -- Create roles
    CREATE ROLE anon NOLOGIN;
    CREATE ROLE authenticated NOLOGIN;
    CREATE ROLE service_role NOLOGIN;

    -- Grant necessary permissions
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO supabase_auth_admin;
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO authenticator;
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO supabase_storage_admin;
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO dashboard_user;

    -- Grant role memberships to authenticator
    GRANT anon TO authenticator;
    GRANT authenticated TO authenticator;
    GRANT service_role TO authenticator;

    -- Create schemas
    CREATE SCHEMA IF NOT EXISTS auth;
    GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
    GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

    CREATE SCHEMA IF NOT EXISTS storage;
    GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
    GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;

    CREATE SCHEMA IF NOT EXISTS extensions;
    GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

    -- Enable required PostgreSQL extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
    CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

    -- Set default privileges for public schema
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;

    -- Set default privileges for auth schema
    ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO supabase_auth_admin;
    ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON SEQUENCES TO supabase_auth_admin;
    ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON FUNCTIONS TO supabase_auth_admin;

    -- Set default privileges for storage schema
    ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON TABLES TO supabase_storage_admin;
    ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON SEQUENCES TO supabase_storage_admin;
    ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON FUNCTIONS TO supabase_storage_admin;
EOSQL

echo "✓ Supabase database initialization completed successfully!"
