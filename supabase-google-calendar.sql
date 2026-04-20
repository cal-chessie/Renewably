-- ============================================================
-- Google Calendar Connections — Supabase Migration
-- ============================================================
-- Run this in Supabase Dashboard > SQL Editor
-- This creates the table that the migrated calendar routes need.
-- ============================================================

CREATE TABLE IF NOT EXISTS google_calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE google_calendar_connections ENABLE ROW LEVEL SECURITY;

-- Service role has full access (needed for API routes)
CREATE POLICY "Service role full access" ON google_calendar_connections
  FOR ALL USING (true) WITH CHECK (true);

-- Users can read their own connection
CREATE POLICY "Users read own connection" ON google_calendar_connections
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can update their own connection
CREATE POLICY "Users update own connection" ON google_calendar_connections
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can delete their own connection
CREATE POLICY "Users delete own connection" ON google_calendar_connections
  FOR DELETE USING (auth.uid()::text = user_id);

-- Index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_gcal_connections_user_id ON google_calendar_connections(user_id);
