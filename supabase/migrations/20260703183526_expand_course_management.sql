alter table public.courses
  add column if not exists batch_name text,
  add column if not exists price_type text not null default 'manual_payment'
    check (price_type in ('free','one_time','monthly','manual_payment')),
  add column if not exists included_content text,
  add column if not exists enrollment_status text not null default 'open'
    check (enrollment_status in ('open','closed','invite_only'));

alter table public.enrollments
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','pending','paid','manual_verified'));

create index if not exists courses_status_public_idx
  on public.courses(status, is_public);
create index if not exists enrollments_course_status_idx
  on public.enrollments(course_id, status);
create index if not exists resources_course_type_status_idx
  on public.resources(course_id, resource_type, status);
