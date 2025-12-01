#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
until pg_isready -U postgres -h localhost; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
done

# Run initialization SQL
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  -- Create required database users
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_auth_admin') THEN
      CREATE USER supabase_auth_admin WITH PASSWORD '$POSTGRES_PASSWORD';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
      CREATE USER authenticator WITH PASSWORD '$POSTGRES_PASSWORD';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_storage_admin') THEN
      CREATE USER supabase_storage_admin WITH PASSWORD '$POSTGRES_PASSWORD';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dashboard_user') THEN
      CREATE USER dashboard_user WITH PASSWORD '$POSTGRES_PASSWORD';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
      CREATE ROLE anon NOLOGIN;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
      CREATE ROLE authenticated NOLOGIN;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
      CREATE ROLE service_role NOLOGIN;
    END IF;
  END
  \$\$;

  -- Grant necessary permissions
  GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO supabase_auth_admin;
  GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO authenticator;
  GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO supabase_storage_admin;
  GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO dashboard_user;

  -- Grant role memberships to authenticator
  GRANT anon TO authenticator;
  GRANT authenticated TO authenticator;
  GRANT service_role TO authenticator;

  -- Create auth schema for GoTrue
  CREATE SCHEMA IF NOT EXISTS auth;
  GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
  GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

  -- Create storage schema
  CREATE SCHEMA IF NOT EXISTS storage;
  GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
  GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;

  -- Create extensions schema
  CREATE SCHEMA IF NOT EXISTS extensions;

  -- Enable required PostgreSQL extensions
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
  CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
  
  -- Grant access to extensions
  GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

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

echo "Supabase database initialization completed successfully!"
