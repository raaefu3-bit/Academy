alter table public.enrollments drop constraint if exists enrollments_status_check;
alter table public.enrollments add constraint enrollments_status_check
  check (status in ('pending','active','rejected','expired','suspended','completed','cancelled'));

alter table public.enrollments
  add column if not exists request_message text,
  add column if not exists review_note text,
  add column if not exists requested_at timestamptz not null default now();

insert into public.enrollments (
  student_id, course_id, status, payment_status, created_at, requested_at,
  approved_by, approved_at, request_message, review_note
)
select
  user_id, course_id,
  case status when 'approved' then 'active' else status end,
  'unpaid', requested_at, requested_at, reviewed_by, reviewed_at, message, review_note
from public.course_access_requests
on conflict (student_id, course_id) do nothing;

create policy "Students request course enrollment" on public.enrollments
for insert to authenticated
with check (
  student_id = auth.uid()
  and status = 'pending'
  and approved_by is null
  and approved_at is null
);

create or replace function public.review_enrollment_request(
  enrollment_id uuid, decision text, note text default null
) returns public.enrollments
language plpgsql security definer set search_path = ''
as $$
declare target public.enrollments;
begin
  select * into target from public.enrollments where id = enrollment_id for update;
  if target.id is null then raise exception 'Enrollment request not found'; end if;
  if not (private.is_admin() or private.can_manage_course(target.course_id)) then raise exception 'Forbidden'; end if;
  if target.status <> 'pending' then raise exception 'Request has already been reviewed'; end if;
  if decision not in ('active','rejected') then raise exception 'Invalid decision'; end if;
  update public.enrollments set status = decision, approved_by = auth.uid(),
    approved_at = case when decision = 'active' then now() else null end,
    review_note = note, updated_at = now()
  where id = enrollment_id returning * into target;
  return target;
end $$;
revoke all on function public.review_enrollment_request(uuid,text,text) from public;
grant execute on function public.review_enrollment_request(uuid,text,text) to authenticated;

create table public.tests (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null, description text,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  total_marks numeric(8,2) check (total_marks is null or total_marks >= 0),
  status text not null default 'draft' check (status in ('draft','published','closed','archived')),
  created_by uuid not null references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.tests enable row level security;
grant select, insert, update, delete on public.tests to authenticated;
create policy "Course staff manage tests" on public.tests
for all to authenticated using (private.can_manage_course(course_id))
with check (private.can_manage_course(course_id));
create policy "Enrolled students read tests" on public.tests
for select to authenticated using (status = 'published' and private.is_enrolled(course_id));
