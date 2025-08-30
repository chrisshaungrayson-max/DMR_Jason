-- RPC to surface auth.uid() for diagnostics
create or replace function public.get_auth_uid()
returns text
language sql
stable
as $$
  select auth.uid();
$$;

revoke all on function public.get_auth_uid() from public;
grant execute on function public.get_auth_uid() to authenticated;
