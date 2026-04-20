-- Google Calendar OAuth connections — one per user
CREATE TABLE IF NOT EXISTS google_calendar_connections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  calendar_id TEXT DEFAULT 'primary',
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE google_calendar_connections ENABLE ROW LEVEL SECURITY;

-- Users can only access their own calendar connections
CREATE POLICY "Users can view own calendar connection" ON google_calendar_connections
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own calendar connection" ON google_calendar_connections
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own calendar connection" ON google_calendar_connections
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own calendar connection" ON google_calendar_connections
  FOR DELETE USING (auth.uid()::text = user_id);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_gcal_connections_user_id ON google_calendar_connections(user_id);
