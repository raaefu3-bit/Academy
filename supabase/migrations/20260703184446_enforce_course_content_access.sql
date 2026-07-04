alter table public.announcements
  add column if not exists send_notification boolean not null default false;
alter table public.live_classes
  add column if not exists reminder_enabled boolean not null default true,
  add column if not exists recording_enabled boolean not null default false;
alter table public.resources
  add column if not exists year text,
  add column if not exists session text,
  add column if not exists paper_number text,
  add column if not exists variant text;

create table if not exists public.recordings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  live_class_id uuid references public.live_classes(id) on delete set null,
  title text not null,
  description text,
  video_url text,
  file_path text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid not null references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.recordings enable row level security;
grant select, insert, update, delete on public.recordings to authenticated;
create policy "Course staff manage recordings" on public.recordings
for all to authenticated using (private.can_manage_course(course_id))
with check (private.can_manage_course(course_id));
create policy "Enrolled students read recordings" on public.recordings
for select to authenticated using (
  status = 'published' and private.is_enrolled(course_id)
);

create or replace function private.has_active_enrollment()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from public.enrollments
  where student_id = auth.uid() and status = 'active'
) $$;
revoke all on function private.has_active_enrollment() from public;
grant execute on function private.has_active_enrollment() to authenticated;

drop policy if exists read_announcements on public.announcements;
create policy read_announcements on public.announcements for select to authenticated
using (
  status = 'published' and (
    (audience_type = 'all' and private.has_active_enrollment())
    or (audience_type = 'course' and course_id is not null and private.is_enrolled(course_id))
    or auth.uid() = any(selected_student_ids)
    or (course_id is not null and private.can_manage_course(course_id))
    or private.is_admin()
  )
);

create or replace function private.sync_course_teacher()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.teacher_id is distinct from new.teacher_id and old.teacher_id is not null then
    delete from public.teacher_courses where course_id = new.id and teacher_id = old.teacher_id;
  end if;
  if new.teacher_id is not null then
    insert into public.teacher_courses(teacher_id, course_id, assigned_by)
    values(new.teacher_id, new.id, auth.uid())
    on conflict (teacher_id, course_id) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists sync_course_teacher on public.courses;
create trigger sync_course_teacher after insert or update of teacher_id on public.courses
for each row execute function private.sync_course_teacher();
