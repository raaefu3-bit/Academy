create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  level text,
  board text,
  description text,
  price numeric(12,2),
  schedule text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teacher_courses (
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (teacher_id, course_id)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'active'
    check (status in ('pending', 'active', 'suspended', 'completed', 'cancelled')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  subject text,
  topic text,
  resource_type text not null check (
    resource_type in (
      'notes', 'past_paper', 'marking_scheme', 'worksheet', 'syllabus',
      'examiner_report', 'formula_sheet', 'recording_file', 'other'
    )
  ),
  file_path text not null,
  file_name text not null,
  file_mime_type text,
  file_size bigint,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  allow_download boolean not null default false,
  created_by uuid not null references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.academy_settings (
  id uuid primary key default gen_random_uuid(),
  academy_name text not null default 'TeachINK Academy',
  teacher_name text,
  teacher_bio text,
  logo_path text,
  hero_title text,
  hero_subtitle text,
  whatsapp_number text,
  phone text,
  email text,
  address text,
  social_links jsonb not null default '{}'::jsonb,
  brand_colors jsonb not null default '{}'::jsonb,
  footer_text text,
  show_testimonials boolean not null default false,
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  changes jsonb,
  created_at timestamptz not null default now()
);

create index enrollments_student_status_idx
  on public.enrollments (student_id, status);
create index resources_course_status_type_idx
  on public.resources (course_id, status, resource_type);

create or replace function private.can_manage_course(target_course_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.is_admin() or exists (
    select 1 from public.teacher_courses
    where teacher_id = auth.uid() and course_id = target_course_id
  )
$$;

create or replace function private.is_enrolled(target_course_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.is_admin() or exists (
    select 1 from public.enrollments
    where student_id = auth.uid()
      and course_id = target_course_id
      and status = 'active'
  )
$$;

revoke all on function private.can_manage_course(uuid) from public;
revoke all on function private.is_enrolled(uuid) from public;
grant execute on function private.can_manage_course(uuid) to authenticated;
grant execute on function private.is_enrolled(uuid) to authenticated;

create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end $$;

create trigger courses_updated_at before update on public.courses
for each row execute function private.touch_updated_at();
create trigger enrollments_updated_at before update on public.enrollments
for each row execute function private.touch_updated_at();
create trigger resources_updated_at before update on public.resources
for each row execute function private.touch_updated_at();
create trigger academy_settings_updated_at before update on public.academy_settings
for each row execute function private.touch_updated_at();

alter table public.courses enable row level security;
alter table public.teacher_courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.resources enable row level security;
alter table public.academy_settings enable row level security;
alter table public.audit_logs enable row level security;

create policy "Admins manage courses" on public.courses
for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "Teachers and students read relevant courses" on public.courses
for select to authenticated using (
  status = 'published'
  and (private.is_enrolled(id) or private.can_manage_course(id))
);

create policy "Admins manage teacher assignments" on public.teacher_courses
for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "Teachers read own assignments" on public.teacher_courses
for select to authenticated using (teacher_id = auth.uid());

create policy "Admins manage enrollments" on public.enrollments
for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "Students and teachers read relevant enrollments" on public.enrollments
for select to authenticated using (
  student_id = auth.uid() or private.can_manage_course(course_id)
);

create policy "Course staff manage resources" on public.resources
for all to authenticated
using (private.can_manage_course(course_id))
with check (private.can_manage_course(course_id));
create policy "Enrolled students read published resources" on public.resources
for select to authenticated using (
  status = 'published' and private.is_enrolled(course_id)
);

create policy "Public reads settings" on public.academy_settings
for select to anon, authenticated using (true);
create policy "Admins manage settings" on public.academy_settings
for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "Admins read audit logs" on public.audit_logs
for select to authenticated using (private.is_admin());

insert into storage.buckets (
  id, name, public, file_size_limit,
  allowed_mime_types
) values (
  'course-resources', 'course-resources', false, 52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg', 'image/png', 'video/mp4'
  ]
) on conflict (id) do update set public = false;

create policy "Course staff upload resource files" on storage.objects
for insert to authenticated with check (
  bucket_id = 'course-resources'
  and private.can_manage_course(((storage.foldername(name))[1])::uuid)
);
create policy "Course staff update resource files" on storage.objects
for update to authenticated
using (
  bucket_id = 'course-resources'
  and private.can_manage_course(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'course-resources'
  and private.can_manage_course(((storage.foldername(name))[1])::uuid)
);
create policy "Course staff delete resource files" on storage.objects
for delete to authenticated using (
  bucket_id = 'course-resources'
  and private.can_manage_course(((storage.foldername(name))[1])::uuid)
);
create policy "Authorized users read resource files" on storage.objects
for select to authenticated using (
  bucket_id = 'course-resources'
  and (
    private.can_manage_course(((storage.foldername(name))[1])::uuid)
    or private.is_enrolled(((storage.foldername(name))[1])::uuid)
  )
);
