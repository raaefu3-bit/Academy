create table public.announcements (
  id uuid primary key default gen_random_uuid(), title text not null, message text not null,
  audience_type text not null default 'all' check (audience_type in ('all','course','selected_students')),
  course_id uuid references public.courses(id) on delete cascade,
  selected_student_ids uuid[] not null default '{}',
  priority text not null default 'normal' check (priority in ('normal','important','urgent')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  scheduled_at timestamptz, created_by uuid not null references public.profiles(id),
  updated_by uuid references public.profiles(id), created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.live_classes (
  id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
  title text not null, description text,
  meeting_provider text not null default 'manual' check (meeting_provider in ('zoom','google_meet','manual')),
  meeting_url text, class_date date not null, start_time time not null, end_time time,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  created_by uuid not null references public.profiles(id), updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.assignments (
  id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
  title text not null, instructions text, attachment_file_path text, due_date timestamptz,
  max_marks numeric(8,2), status text not null default 'draft' check (status in ('draft','published','closed')),
  created_by uuid not null references public.profiles(id), updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(), assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  submission_file_path text, notes text,
  status text not null default 'submitted' check (status in ('submitted','marked','returned')),
  marks numeric(8,2), feedback text, submitted_at timestamptz not null default now(),
  marked_by uuid references public.profiles(id), marked_at timestamptz,
  updated_at timestamptz not null default now(), unique (assignment_id,student_id)
);
create table public.payments (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null, amount numeric(12,2) not null,
  currency text not null default 'PKR', billing_period text, due_date date,
  status text not null default 'unpaid' check (status in ('unpaid','pending_review','paid','rejected')),
  admin_notes text, reviewed_by uuid references public.profiles(id), reviewed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.payment_proofs (
  id uuid primary key default gen_random_uuid(), payment_id uuid not null references public.payments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade, proof_file_path text not null,
  status text not null default 'pending_review' check (status in ('pending_review','approved','rejected')),
  admin_notes text, reviewed_by uuid references public.profiles(id), reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
do $$ declare t text; begin foreach t in array array['announcements','live_classes','assignments','assignment_submissions','payments','payment_proofs'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;
create policy manage_announcements on public.announcements for all to authenticated using (private.is_admin() or (course_id is not null and private.can_manage_course(course_id))) with check (private.is_admin() or (course_id is not null and private.can_manage_course(course_id)));
create policy read_announcements on public.announcements for select to authenticated using (status='published' and (audience_type='all' or (audience_type='course' and private.is_enrolled(course_id)) or auth.uid()=any(selected_student_ids)));
create policy manage_classes on public.live_classes for all to authenticated using (private.can_manage_course(course_id)) with check (private.can_manage_course(course_id));
create policy read_classes on public.live_classes for select to authenticated using (private.is_enrolled(course_id) or private.can_manage_course(course_id));
create policy manage_assignments on public.assignments for all to authenticated using (private.can_manage_course(course_id)) with check (private.can_manage_course(course_id));
create policy read_assignments on public.assignments for select to authenticated using ((status='published' and private.is_enrolled(course_id)) or private.can_manage_course(course_id));
create policy own_submissions on public.assignment_submissions for insert to authenticated with check (student_id=auth.uid());
create policy read_submissions on public.assignment_submissions for select to authenticated using (student_id=auth.uid() or private.can_manage_course((select course_id from public.assignments where id=assignment_id)));
create policy mark_submissions on public.assignment_submissions for update to authenticated using (private.can_manage_course((select course_id from public.assignments where id=assignment_id))) with check (private.can_manage_course((select course_id from public.assignments where id=assignment_id)));
create policy own_payments on public.payments for select to authenticated using (student_id=auth.uid() or private.is_admin());
create policy admin_payments on public.payments for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy own_proofs on public.payment_proofs for select to authenticated using (student_id=auth.uid() or private.is_admin());
create policy submit_proofs on public.payment_proofs for insert to authenticated with check (student_id=auth.uid());
create policy admin_proofs on public.payment_proofs for all to authenticated using (private.is_admin()) with check (private.is_admin());
create trigger audit_announcements after insert or update or delete on public.announcements for each row execute function private.log_academy_change();
create trigger audit_live_classes after insert or update or delete on public.live_classes for each row execute function private.log_academy_change();
create trigger audit_assignments after insert or update or delete on public.assignments for each row execute function private.log_academy_change();
create trigger audit_payments after insert or update or delete on public.payments for each row execute function private.log_academy_change();
