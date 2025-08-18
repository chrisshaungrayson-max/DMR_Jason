-- Add avatar_url to profiles for storing profile image location
alter table if exists public.profiles
  add column if not exists avatar_url text;

-- Note: Supabase Storage buckets are managed outside SQL migrations.
-- Create a public bucket named 'avatars' in the Supabase dashboard and set appropriate policies.
-- Client will write to storage and persist the public URL in profiles.avatar_url.
