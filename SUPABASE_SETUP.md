# Supabase first setup

1. Apply `supabase/migrations/20260703124513_create_profiles_and_roles.sql` to project `rnebhgbqdxlemfvlnczp`.
2. In Supabase Auth, create the first account through the application's `/login` signup form.
3. In the Supabase SQL editor, promote that existing profile:

```sql
update public.profiles
set role = 'super_admin'
where email = 'feroze.qadri.2009@gmail.com';
```

4. Sign out and sign in again, then open `/admin`.

All other new users are created as `student` by the database trigger. Role changes are performed through database functions that require the caller to already be a `super_admin`.

The publishable key belongs in `.env`. Never put a secret or service-role key in a `VITE_` variable.
