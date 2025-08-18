-- Optional goal_measurements table for per-goal manual entries
-- Conforms to project conventions: UUID PKs, RLS, owner-only policies via parent goal

create table if not exists public.goal_measurements (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  date date not null,
  value jsonb not null default '{}'::jsonb,
  source text not null check (source in ('manual','log')) default 'manual',
  created_at timestamptz not null default now()
);

create index if not exists goal_measurements_goal_date_idx on public.goal_measurements(goal_id, date);

-- RLS: user must own the parent goal
alter table public.goal_measurements enable row level security;

create policy goal_measurements_select_own on public.goal_measurements
  for select to authenticated
  using (exists (
    select 1 from public.goals g
    where g.id = goal_id and g.user_id = auth.uid()
  ));

create policy goal_measurements_insert_own on public.goal_measurements
  for insert to authenticated
  with check (exists (
    select 1 from public.goals g
    where g.id = goal_id and g.user_id = auth.uid()
  ));

create policy goal_measurements_update_own on public.goal_measurements
  for update to authenticated
  using (exists (
    select 1 from public.goals g
    where g.id = goal_id and g.user_id = auth.uid()
  ));

create policy goal_measurements_delete_own on public.goal_measurements
  for delete to authenticated
  using (exists (
    select 1 from public.goals g
    where g.id = goal_id and g.user_id = auth.uid()
  ));
