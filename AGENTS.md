<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Project overview
Maju Bersama 178 is an Indonesian multi-store marketplace (PWA, dark theme) built with **Next.js 16.2.3** (App Router + Turbopack), **Supabase** (Auth + PostgreSQL + Storage), **Tailwind CSS 4**, and **TypeScript 5**. It is a single app (not a monorepo).

### Required secrets (`.env.local`)
Copy from `.env.example`. The three Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are required; `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is optional (store location map only). When running in Cursor Cloud, these are injected as environment variables and must be written to `.env.local` before starting the dev server:

```bash
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=${NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
EOF
```

### Common commands
| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (Turbopack, port 3000) |
| Lint | `npm run lint` (ESLint 9) |
| Build | `npm run build` |
| Full test | `npm test` (runs lint + build) |

### Login gotcha
The login page (`/login`) takes a **username** (e.g. `mama01`), not a full email. The app auto-appends `@local.mb178`. Test owner accounts use password `223344`; super-admin accounts use `178178`. See `supabase/README.md` for the full list.

### Database
The app uses a remote hosted Supabase instance. SQL seed files live in `/workspace/supabase/` and are meant to be run in the Supabase Dashboard SQL Editor (not locally). There is no local Supabase or Docker setup.
