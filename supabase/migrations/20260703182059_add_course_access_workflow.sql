alter table public.courses
  add column if not exists slug text,
  add column if not exists level_group text,
  add column if not exists class_type text not null default 'live',
  add column if not exists short_description text,
  add column if not exists currency text not null default 'PKR',
  add column if not exists duration text,
  add column if not exists teacher_id uuid references public.profiles(id),
  add column if not exists thumbnail_url text,
  add column if not exists is_public boolean not null default true;

create unique index if not exists courses_slug_unique
  on public.courses(slug) where slug is not null;

create table public.course_access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  student_name text not null,
  student_email text not null,
  phone text,
  parent_phone text,
  level text,
  message text,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','cancelled')),
  requested_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_note text,
  unique(user_id, course_id)
);

alter table public.enrollments
  add column if not exists approved_by uuid references public.profiles(id),
  add column if not exists approved_at timestamptz,
  add column if not exists expires_at timestamptz;

create index course_access_requests_status_idx
  on public.course_access_requests(status, requested_at desc);
alter table public.course_access_requests enable row level security;
grant select, insert, update on public.course_access_requests to authenticated;

create policy "Students read own access requests"
on public.course_access_requests for select to authenticated
using ((select auth.uid()) = user_id or private.is_admin());

create policy "Students create own access requests"
on public.course_access_requests for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

create policy "Students cancel pending own requests"
on public.course_access_requests for update to authenticated
using ((select auth.uid()) = user_id and status = 'pending')
with check (
  (select auth.uid()) = user_id
  and status = 'cancelled'
  and reviewed_by is null
);

create policy "Admins manage access requests"
on public.course_access_requests for all to authenticated
using (private.is_admin()) with check (private.is_admin());

drop policy if exists "Teachers and students read relevant courses" on public.courses;
create policy "Published courses are browsable"
on public.courses for select to anon, authenticated
using (status = 'published' and is_public = true);

create policy "Staff read relevant courses"
on public.courses for select to authenticated
using (private.can_manage_course(id));

create or replace function public.review_course_access_request(
  request_id uuid,
  decision text,
  note text default null
) returns public.course_access_requests
language plpgsql security definer set search_path = ''
as $$
declare
  target public.course_access_requests;
begin
  if not private.is_admin() then raise exception 'Forbidden'; end if;
  if decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;

  select * into target from public.course_access_requests
  where id = request_id for update;
  if target.id is null then raise exception 'Request not found'; end if;
  if target.status <> 'pending' then raise exception 'Request has already been reviewed'; end if;

  update public.course_access_requests set
    status = decision,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_note = note
  where id = request_id returning * into target;

  if decision = 'approved' then
    insert into public.enrollments
      (student_id, course_id, status, created_by, approved_by, approved_at)
    values
      (target.user_id, target.course_id, 'active', auth.uid(), auth.uid(), now())
    on conflict (student_id, course_id) do update set
      status = 'active',
      approved_by = auth.uid(),
      approved_at = now(),
      updated_at = now();
  end if;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, changes)
  values (
    auth.uid(), 'review_access_request', 'course_access_request', target.id::text,
    jsonb_build_object('decision', decision, 'course_id', target.course_id)
  );
  return target;
end $$;

revoke all on function public.review_course_access_request(uuid,text,text) from public;
grant execute on function public.review_course_access_request(uuid,text,text) to authenticated;
