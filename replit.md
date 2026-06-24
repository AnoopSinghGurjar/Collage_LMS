# College LMS Platform

A full-stack Learning Management System for colleges with Student, Faculty, Admin, and HOD roles — featuring dashboards, timetable, assignments, quizzes, attendance, results, study materials, notices, events, and leave management.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, TanStack Query, Wouter (routing)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (14 tables)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → react-query hooks + zod schemas)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/api-client-react/src/generated/` — generated hooks + schemas (do not edit manually)
- `lib/db/src/schema.ts` — Drizzle ORM schema (14 tables)
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/college-lms/src/pages/` — all frontend pages organized by role
- `artifacts/college-lms/src/context/AuthContext.tsx` — auth state, role detection

## Architecture decisions

- Contract-first API: OpenAPI spec drives both client hooks (Orval → react-query) and server validation (Zod)
- Role-based auth: token = base64(userId:timestamp:lms_secret), hashed with SHA-256 + "lms_salt"
- All routes under `/api` prefix; API server on port 8080, frontend on ~19482, shared proxy at port 80
- ProtectedRoute component gates pages by role array (`allowedRoles`)
- Orval `mode: "split"` with a single `api.ts` output (all hooks generated there, not re-exported separately)

## Product

- **Admin/HOD**: Manage students, faculty, departments, subjects, timetable, notices, events, leave approvals
- **Faculty**: View dashboard, manage study materials, grade assignments, mark attendance, create quizzes
- **Students**: View timetable, assignments, quizzes, attendance, results, notices, events, and apply for leave

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@college.edu | admin123 |
| HOD | hod.cse@college.edu | hod123 |
| Faculty | anita.verma@college.edu | faculty123 |
| Student | arjun.patel@student.college.edu | student123 |

## Gotchas

- After editing OpenAPI spec, always run `pnpm --filter @workspace/api-spec run codegen` — it regenerates hooks AND runs typecheck:libs
- Orval generates ALL mutation hooks directly in `api.ts` (not split files despite `mode: "split"`); do NOT add duplicate custom hooks or index.ts re-exports will conflict
- `useApplyLeave` is the generated hook name for applying leave (not `useCreateLeave`)
- Admin dashboard route is `/admin` (not `/admin/dashboard`)
- DB seeded with 4 depts, 13 students, 4 faculty, 8 subjects, timetable, quizzes, results, notices, events

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
