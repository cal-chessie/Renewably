-- Renewably Relay: invitation-only client setup.
-- This is deliberately separate from the retired public SolarPilot onboarding tables.

create table if not exists public.relay_setup_invites (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  email text not null,
  contact_name text not null,
  company_name text not null,
  status text not null default 'issued' check (status in ('issued', 'in_progress', 'submitted_for_review', 'blocked', 'expired', 'revoked')),
  expires_at timestamptz not null,
  created_by_profile_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  opened_at timestamptz,
  submitted_at timestamptz,
  revoked_at timestamptz
);

create table if not exists public.relay_setup_intakes (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null unique references public.relay_setup_invites(id) on delete cascade,
  intake_version text not null,
  current_stage smallint not null default 1 check (current_stage between 1 and 8),
  answers jsonb not null default '{}'::jsonb,
  assets jsonb not null default '[]'::jsonb,
  missing_field_ids jsonb not null default '[]'::jsonb,
  builder_handover jsonb,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted_for_review', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.relay_setup_invites enable row level security;
alter table public.relay_setup_intakes enable row level security;
-- No public policies. Application access uses the service role after token validation.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('relay-setup-assets', 'relay-setup-assets', false, 26214400,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp', 'text/csv'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
