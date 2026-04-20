-- ============================================================================
-- RENEWABLY CRM — Full Schema Migration
-- ============================================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================================
-- USERS (we'll use Supabase Auth for auth, this is our profile table)
-- ============================================================================
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null default 'admin' check (role in ('admin', 'manager', 'user')),
  avatar text,
  phone text,
  is_active boolean default true,
  last_login_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- COMPANIES
-- ============================================================================
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  counties text not null default '',
  seai_reg text,
  team_size int,
  installs_per_year int,
  status text not null default 'prospect' check (status in ('prospect', 'active', 'inactive', 'churned')),
  logo_url text,
  website text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- CONTACTS
-- ============================================================================
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role text,
  is_decision_maker boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- DEALS
-- ============================================================================
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product text not null check (product in ('solarpilot', 'ai_workforce', 'both')),
  mrr float8,
  setup_fee float8,
  stage text not null default 'new_lead' check (stage in ('new_lead', 'contacted', 'discovery_call', 'demo_booked', 'demo_done', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost')),
  qualified_answers text,
  demo_outcome text,
  close_reason text,
  assigned_to_id uuid references public.profiles(id),
  value float8,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- DEAL ACTIVITIES
-- ============================================================================
create table public.deal_activities (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  type text not null check (type in ('call', 'email', 'demo', 'proposal', 'note', 'meeting', 'task', 'system')),
  title text not null,
  content text,
  created_at timestamptz default now()
);

-- ============================================================================
-- ONBOARDING
-- ============================================================================
create table public.onboarding (
  id uuid primary key default gen_random_uuid(),
  company_id uuid unique not null references public.companies(id) on delete cascade,
  solarpilot_progress int default 0 check (solarpilot_progress >= 0 and solarpilot_progress <= 100),
  ai_workforce_progress int default 0 check (ai_workforce_progress >= 0 and ai_workforce_progress <= 100),
  solarpilot_steps text,
  ai_workforce_steps text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
create index idx_contacts_company_id on public.contacts(company_id);
create index idx_deals_company_id on public.deals(company_id);
create index idx_deals_stage on public.deals(stage);
create index idx_deal_activities_deal_id on public.deal_activities(deal_id);
create index idx_deal_activities_created_at on public.deal_activities(created_at);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.deals enable row level security;
alter table public.deal_activities enable row level security;
alter table public.onboarding enable row level security;

-- ============================================================================
-- RLS POLICIES — Allow authenticated users full access
-- ============================================================================
create policy "Authenticated users can read profiles" on public.profiles for select to authenticated using (true);
create policy "Authenticated users can insert profiles" on public.profiles for insert to authenticated with check (true);
create policy "Authenticated users can update profiles" on public.profiles for update to authenticated using (true);
create policy "Authenticated users can delete profiles" on public.profiles for delete to authenticated using (true);

create policy "Authenticated users can read companies" on public.companies for select to authenticated using (true);
create policy "Authenticated users can insert companies" on public.companies for insert to authenticated with check (true);
create policy "Authenticated users can update companies" on public.companies for update to authenticated using (true);
create policy "Authenticated users can delete companies" on public.companies for delete to authenticated using (true);

create policy "Authenticated users can read contacts" on public.contacts for select to authenticated using (true);
create policy "Authenticated users can insert contacts" on public.contacts for insert to authenticated with check (true);
create policy "Authenticated users can update contacts" on public.contacts for update to authenticated using (true);
create policy "Authenticated users can delete contacts" on public.contacts for delete to authenticated using (true);

create policy "Authenticated users can read deals" on public.deals for select to authenticated using (true);
create policy "Authenticated users can insert deals" on public.deals for insert to authenticated with check (true);
create policy "Authenticated users can update deals" on public.deals for update to authenticated using (true);
create policy "Authenticated users can delete deals" on public.deals for delete to authenticated using (true);

create policy "Authenticated users can read deal_activities" on public.deal_activities for select to authenticated using (true);
create policy "Authenticated users can insert deal_activities" on public.deal_activities for insert to authenticated with check (true);
create policy "Authenticated users can update deal_activities" on public.deal_activities for update to authenticated using (true);
create policy "Authenticated users can delete deal_activities" on public.deal_activities for delete to authenticated using (true);

create policy "Authenticated users can read onboarding" on public.onboarding for select to authenticated using (true);
create policy "Authenticated users can insert onboarding" on public.onboarding for insert to authenticated with check (true);
create policy "Authenticated users can update onboarding" on public.onboarding for update to authenticated using (true);
create policy "Authenticated users can delete onboarding" on public.onboarding for delete to authenticated using (true);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();
create trigger companies_updated_at before update on public.companies for each row execute function public.handle_updated_at();
create trigger contacts_updated_at before update on public.contacts for each row execute function public.handle_updated_at();
create trigger deals_updated_at before update on public.deals for each row execute function public.handle_updated_at();
create trigger onboarding_updated_at before update on public.onboarding for each row execute function public.handle_updated_at();
