-- Rollback for 0004_goal_measurements.sql

-- Drop RLS policies
drop policy if exists goal_measurements_delete_own on public.goal_measurements;
drop policy if exists goal_measurements_update_own on public.goal_measurements;
drop policy if exists goal_measurements_insert_own on public.goal_measurements;
drop policy if exists goal_measurements_select_own on public.goal_measurements;

-- Disable RLS (optional)
alter table if exists public.goal_measurements disable row level security;

-- Drop indexes
drop index if exists public.goal_measurements_goal_date_idx;

-- Drop table
drop table if exists public.goal_measurements;
