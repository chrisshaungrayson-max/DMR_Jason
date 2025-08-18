-- Enable required extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- profiles table (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  sex text check (sex in ('male','female','other','')) default '',
  age int,
  height text,
  weight text,
  use_metric_units boolean default true,
  use_dark_mode boolean,
  activity_level text check (activity_level in ('sedentary','light','moderate','heavy','athlete')),
  tdee int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- macro targets (per user)
create table if not exists public.macro_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  split_protein int not null default 30,
  split_carbs int not null default 40,
  split_fat int not null default 30,
  source text not null default 'tdee',
  calories_basis int not null default 0,
  grams_protein int not null default 0,
  grams_carbs int not null default 0,
  grams_fat int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);
create index if not exists macro_targets_user_id_idx on public.macro_targets(user_id);

-- daily totals
create table if not exists public.days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  total_calories numeric not null default 0,
  total_protein numeric not null default 0,
  total_carbs numeric not null default 0,
  total_fat numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, date)
);
create index if not exists days_user_id_idx on public.days(user_id);

-- entries within a day
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid not null references public.days(id) on delete cascade,
  name text not null,
  calories numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists entries_user_id_idx on public.entries(user_id);
create index if not exists entries_day_id_idx on public.entries(day_id);

-- foods catalog (frequently eaten foods)
create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  brand text,
  portion text,
  calories numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  tags text[] default '{}',
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists foods_user_id_idx on public.foods(user_id);
create index if not exists foods_name_trgm_idx on public.foods using gin (name gin_trgm_ops);

-- RLS
alter table public.profiles enable row level security;
alter table public.macro_targets enable row level security;
alter table public.days enable row level security;
alter table public.entries enable row level security;
alter table public.foods enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_upsert_own on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid());

create policy macro_targets_select_own on public.macro_targets for select to authenticated using (user_id = auth.uid());
create policy macro_targets_write_own on public.macro_targets for insert to authenticated with check (user_id = auth.uid());
create policy macro_targets_update_own on public.macro_targets for update to authenticated using (user_id = auth.uid());
create policy macro_targets_delete_own on public.macro_targets for delete to authenticated using (user_id = auth.uid());

create policy days_select_own on public.days for select to authenticated using (user_id = auth.uid());
create policy days_write_own on public.days for insert to authenticated with check (user_id = auth.uid());
create policy days_update_own on public.days for update to authenticated using (user_id = auth.uid());
create policy days_delete_own on public.days for delete to authenticated using (user_id = auth.uid());

create policy entries_select_own on public.entries for select to authenticated using (user_id = auth.uid());
create policy entries_write_own on public.entries for insert to authenticated with check (user_id = auth.uid());
create policy entries_update_own on public.entries for update to authenticated using (user_id = auth.uid());
create policy entries_delete_own on public.entries for delete to authenticated using (user_id = auth.uid());

create policy foods_select_own on public.foods for select to authenticated using (user_id = auth.uid());
create policy foods_write_own on public.foods for insert to authenticated with check (user_id = auth.uid());
create policy foods_update_own on public.foods for update to authenticated using (user_id = auth.uid());
create policy foods_delete_own on public.foods for delete to authenticated using (user_id = auth.uid());
