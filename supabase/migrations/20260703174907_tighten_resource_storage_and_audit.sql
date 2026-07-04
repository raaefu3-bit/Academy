drop policy "Authorized users read resource files" on storage.objects;
create policy "Authorized users read published resource files" on storage.objects
for select to authenticated using (
  bucket_id = 'course-resources'
  and (
    private.can_manage_course(((storage.foldername(name))[1])::uuid)
    or exists (
      select 1 from public.resources r
      where r.file_path = name
        and r.status = 'published'
        and private.is_enrolled(r.course_id)
    )
  )
);

create or replace function private.log_academy_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, changes)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    coalesce(
      to_jsonb(new) ->> 'id', to_jsonb(old) ->> 'id',
      to_jsonb(new) ->> 'course_id', to_jsonb(old) ->> 'course_id'
    ),
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.log_academy_change() from public;

create trigger audit_courses after insert or update or delete on public.courses
for each row execute function private.log_academy_change();
create trigger audit_resources after insert or update or delete on public.resources
for each row execute function private.log_academy_change();
create trigger audit_enrollments after insert or update or delete on public.enrollments
for each row execute function private.log_academy_change();
create trigger audit_teacher_courses after insert or update or delete on public.teacher_courses
for each row execute function private.log_academy_change();
