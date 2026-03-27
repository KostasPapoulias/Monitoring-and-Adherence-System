-- Initial database setup for AMI (Adherence Monitoring and Interaction)
-- This script runs on first Postgres startup

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Create initial schema (comment out if using Prisma migrations)
-- Prisma will handle schema creation, but this can be useful for reference

COMMENT ON DATABASE postgres IS 'AMI - Adherence Monitoring and Interaction System';
