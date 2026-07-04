alter table public.profiles add column if not exists academic_level text
  check (academic_level in ('O Levels','IGCSE','AS / A1','A2','A Level'));
grant update (academic_level) on public.profiles to authenticated;

alter table public.courses add column if not exists course_target_levels text[] not null default '{}';
alter table public.courses add constraint courses_target_levels_allowed
  check (course_target_levels <@ array['O Levels','IGCSE','AS / A1','A2','A Level']::text[]);

update public.courses set course_target_levels = case
  when level ilike '%O Level%' then array['O Levels']
  when level ilike '%IGCSE%' then array['IGCSE']
  when level ilike '%AS / A1%' or level ilike '%AS Level%' or level = 'AS' then array['AS / A1']
  when level ilike '%A2%' then array['A2']
  when level = 'A Level' then array['A Level']
  else course_target_levels
end where cardinality(course_target_levels) = 0;

create or replace function private.student_can_discover_course(target_course_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.courses c
    join public.profiles p on p.id = auth.uid()
    where c.id = target_course_id
      and c.status = 'published' and c.is_public = true
      and p.role = 'student' and p.is_active = true
      and p.academic_level = any(c.course_target_levels)
  )
$$;
revoke all on function private.student_can_discover_course(uuid) from public;
grant execute on function private.student_can_discover_course(uuid) to authenticated;

drop policy if exists "Published courses are browsable" on public.courses;
create policy "Anonymous users browse published courses" on public.courses
for select to anon using (status = 'published' and is_public = true);
create policy "Students browse matching published courses" on public.courses
for select to authenticated using (private.student_can_discover_course(id));

drop policy if exists "Students request course enrollment" on public.enrollments;
create policy "Students request matching course enrollment" on public.enrollments
for insert to authenticated with check (
  student_id = auth.uid()
  and status = 'pending'
  and approved_by is null and approved_at is null
  and private.student_can_discover_course(course_id)
);

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, role, academic_level)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    coalesce(new.email, ''),
    'student',
    case when new.raw_user_meta_data ->> 'academic_level'
      in ('O Levels','IGCSE','AS / A1','A2','A Level')
      then new.raw_user_meta_data ->> 'academic_level' else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
