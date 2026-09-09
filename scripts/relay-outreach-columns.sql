-- ============================================================================
-- Relay: room to hold the outreach intelligence for your 52 work-first leads.
-- Additive only. Nothing is deleted. No security/RLS settings are changed.
-- Safe to run once or twice (IF NOT EXISTS guards every line).
-- ============================================================================

-- On each opportunity (deal): who to speak to, the angle, the channel, the play,
-- and which outbound list it belongs to.
ALTER TABLE deals    ADD COLUMN IF NOT EXISTS contact_id    uuid;
ALTER TABLE deals    ADD COLUMN IF NOT EXISTS angle         text;
ALTER TABLE deals    ADD COLUMN IF NOT EXISTS channel       text;
ALTER TABLE deals    ADD COLUMN IF NOT EXISTS next_action   text;
ALTER TABLE deals    ADD COLUMN IF NOT EXISTS list_cohort   text;
ALTER TABLE deals    ADD COLUMN IF NOT EXISTS next_touch    date;

-- On the person: how to greet them on the call, and the hard do-not-email flag.
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS greeting_name text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS do_not_email  boolean DEFAULT false;
