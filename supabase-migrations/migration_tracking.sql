-- ============================================================================
-- Migration Tracking — Creates _schema_migrations table
-- ============================================================================
-- Run this ONCE against your Supabase project to enable migration tracking.
-- Then run each subsequent migration wrapped in:
--
--   INSERT INTO _schema_migrations (name) VALUES ('migration_name')
--   ON CONFLICT DO NOTHING;
--
-- This prevents re-running migrations that have already been applied.
-- ============================================================================

CREATE TABLE IF NOT EXISTS _schema_migrations (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mark existing migrations as already applied (adjust if needed)
INSERT INTO _schema_migrations (name) VALUES
  ('migration_001_full_schema'),
  ('migration_002_schema_cleanup'),
  ('rls-policies'),
  ('google_calendar_connections')
ON CONFLICT DO NOTHING;

-- Optional: Prevent accidental writes to this table from anon users
ALTER TABLE _schema_migrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON _schema_migrations
  FOR ALL USING (true) WITH CHECK (true);
