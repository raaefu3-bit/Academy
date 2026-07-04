create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  role text not null default 'student'
    check (role in ('super_admin', 'admin', 'student')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid()) and is_active = true
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_user_role() in ('admin', 'super_admin'), false)
$$;

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_user_role() = 'super_admin', false)
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on all functions in schema private from public;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_super_admin() to authenticated;

create policy "Users can read own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "Admins can read all profiles"
on public.profiles for select
to authenticated
using ((select private.is_admin()));

create policy "Users can update own basic profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id and is_active = true)
with check ((select auth.uid()) = id and is_active = true);

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name) on table public.profiles to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    'student'
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function public.set_user_role(target_user_id uuid, new_role text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.profiles;
  remaining_super_admins integer;
begin
  if not private.is_super_admin() then
    raise exception 'Only a super admin can change roles';
  end if;

  if new_role not in ('admin', 'student') then
    raise exception 'Role must be admin or student';
  end if;

  select * into target from public.profiles where id = target_user_id for update;
  if not found then raise exception 'Profile not found'; end if;

  if target.role = 'super_admin' then
    select count(*) into remaining_super_admins
    from public.profiles
    where role = 'super_admin' and is_active = true and id <> target_user_id;
    if remaining_super_admins = 0 then
      raise exception 'The last active super admin cannot be demoted';
    end if;
  end if;

  update public.profiles
  set role = new_role
  where id = target_user_id
  returning * into target;
  return target;
end;
$$;

create or replace function public.set_user_active(target_user_id uuid, active boolean)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.profiles;
  remaining_super_admins integer;
begin
  if not private.is_super_admin() then
    raise exception 'Only a super admin can change account status';
  end if;

  select * into target from public.profiles where id = target_user_id for update;
  if not found then raise exception 'Profile not found'; end if;

  if target.role = 'super_admin' and not active then
    select count(*) into remaining_super_admins
    from public.profiles
    where role = 'super_admin' and is_active = true and id <> target_user_id;
    if remaining_super_admins = 0 then
      raise exception 'The last active super admin cannot be deactivated';
    end if;
  end if;

  update public.profiles
  set is_active = active
  where id = target_user_id
  returning * into target;
  return target;
end;
$$;

revoke all on function public.set_user_role(uuid, text) from public;
revoke all on function public.set_user_active(uuid, boolean) from public;
grant execute on function public.set_user_role(uuid, text) to authenticated;
grant execute on function public.set_user_active(uuid, boolean) to authenticated;

grant usage on schema public to anon, authenticated;
