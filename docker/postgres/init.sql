-- docker/postgres/init.sql

-- Enable UUID extension for auto-generating primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_stat_statements for query performance monitoring
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Force database timezone to UTC to prevent timestamp drift
ALTER SYSTEM SET timezone = 'UTC';
SELECT pg_reload_conf();

-- Create a read-only role for safe analytical querying and debugging
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'readonly_user') THEN
      CREATE ROLE readonly_user WITH LOGIN PASSWORD 'readonly';
   END IF;
END
$do$;

-- Grant connect privileges
GRANT CONNECT ON DATABASE postgres TO readonly_user;

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO readonly_user;

-- Grant read access to all current and future tables in the public schema
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;
