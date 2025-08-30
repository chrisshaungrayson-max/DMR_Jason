-- Migrate user id columns from uuid (auth.users) to text (Clerk user id)
-- WARNING: Run in development first. In production, plan a safe backfill.

begin;

-- Drop FKs and adjust types
alter table if exists public.profiles
  drop constraint if exists profiles_id_fkey;

-- Convert columns to text
alter table if exists public.profiles
  alter column id type text using id::text;

alter table if exists public.macro_targets
  alter column user_id type text using user_id::text;

alter table if exists public.days
  alter column user_id type text using user_id::text;

alter table if exists public.entries
  alter column user_id type text using user_id::text;

alter table if exists public.foods
  alter column user_id type text using user_id::text;

-- Recreate indexes if any depended on uuid ops (no change needed for default btree)
-- RLS policies still compare to auth.uid() and remain valid with text columns

commit;
