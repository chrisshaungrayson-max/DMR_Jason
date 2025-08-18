-- Goals table for tracking user fitness goals
-- Conventions aligned with existing migrations: UUID PKs, text checks, RLS, owner-only policies

-- Create goal type/status checks
-- Using text + CHECK to match existing style (e.g., profiles.sex)

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in (
    'body_fat',
    'weight',
    'lean_mass_gain',
    'calorie_streak',
    'protein_streak'
  )),
  params jsonb not null default '{}'::jsonb,
  start_date date not null default (now() at time zone 'utc')::date,
  end_date date not null,
  active boolean not null default true,
  status text not null check (status in ('active','achieved','deactivated')) default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists goals_type_idx on public.goals(type);

-- Enforce: only one ACTIVE goal per (user_id, type)
create unique index if not exists goals_one_active_per_type_idx
  on public.goals(user_id, type)
  where active = true;

-- Enable RLS and add policies (owner-only)
alter table public.goals enable row level security;

create policy goals_select_own on public.goals
  for select to authenticated
  using (user_id = auth.uid());

create policy goals_insert_own on public.goals
  for insert to authenticated
  with check (user_id = auth.uid());

create policy goals_update_own on public.goals
  for update to authenticated
  using (user_id = auth.uid());

create policy goals_delete_own on public.goals
  for delete to authenticated
  using (user_id = auth.uid());
