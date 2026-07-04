# TeachINK Academy

TeachINK is a private, branded academy LMS for managing courses, students, teachers, resources, live classes, announcements, assignments, tests, enrollments, and manual payments.

## Technology

- React 19 and TypeScript
- TanStack Start and TanStack Router
- Vite 8
- Tailwind CSS 4
- Supabase Auth, PostgreSQL, Row Level Security, and private Storage
- Radix UI and Lucide icons

## Local setup

Requirements: Node.js 20+ and npm.

```bash
npm install
copy .env.example .env
npm run dev
```

The development server runs at `http://localhost:8080`.

Configure `.env` with the public Supabase project URL and publishable key:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key_here
```

Only browser-safe publishable values may use the `VITE_` prefix. Never put a Supabase service-role key, private API key, password, or GitHub token in frontend variables.

## Supabase migrations

Database migrations are stored in [`supabase/migrations`](supabase/migrations).

After installing and authenticating the Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Review migrations before applying them to a production project. Keep service-role credentials outside the repository.

## Roles and access

- `super_admin`: full platform ownership
- `admin`: academy management
- `teacher`: assigned-course management only
- `student`: approved enrolled-course content only

New accounts start as students. Roles are read from `profiles.role`, not user-editable metadata. Student discovery is filtered by academic level, while private content requires an active course enrollment. Database RLS remains the final authorization boundary.

## Commands

```bash
npm run dev       # local development
npm run lint      # ESLint
npm run build     # production build
npm run preview   # preview production build
```

## Repository safety

- Real `.env` files are ignored.
- `node_modules`, builds, logs, hosting metadata, and local Supabase state are ignored.
- `.env.example` contains placeholders only.
- Never commit passwords, service-role keys, API keys, access tokens, or generated signed URLs.

## Project areas

- `/` — public academy website and published course discovery
- `/student` — authenticated student learning portal
- `/admin` — unified role-aware admin and teacher management panel

Legacy teacher routes redirect into the unified management panel.

## License

Proprietary — TeachINK Academy.
