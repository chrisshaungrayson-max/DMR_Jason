-- Rollback for 0003_goals.sql

-- Drop RLS policies
drop policy if exists goals_delete_own on public.goals;
drop policy if exists goals_update_own on public.goals;
drop policy if exists goals_insert_own on public.goals;
drop policy if exists goals_select_own on public.goals;

-- Disable RLS (optional)
alter table if exists public.goals disable row level security;

-- Drop indexes
drop index if exists public.goals_one_active_per_type_idx;
drop index if exists public.goals_type_idx;
drop index if exists public.goals_user_id_idx;

-- Drop table
drop table if exists public.goals;
