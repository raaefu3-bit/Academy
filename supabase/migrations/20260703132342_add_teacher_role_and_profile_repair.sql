alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'admin', 'teacher', 'student'));

create or replace function public.ensure_my_profile()
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_id uuid := auth.uid();
  current_email text := auth.jwt() ->> 'email';
  repaired public.profiles;
begin
  if current_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    current_id,
    coalesce(current_email, ''),
    nullif(trim(coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', '')), ''),
    'student'
  )
  on conflict (id) do nothing;

  select * into repaired
  from public.profiles
  where id = current_id;

  return repaired;
end;
$$;

revoke all on function public.ensure_my_profile() from public, anon;
grant execute on function public.ensure_my_profile() to authenticated;
