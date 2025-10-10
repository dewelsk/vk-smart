# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds Next.js route segments (admin/applicant flows, API routes, shared layout) with co-located UI and server actions.
- `components/`, `hooks/`, `lib/`, and `types/` store reusable UI primitives, React hooks, domain helpers, and TypeScript contracts — favor importing via `@/` aliases.
- `prisma/` contains the schema, migrations, and `seed.ts`; database fixtures live here and fuel Playwright smoke tests.
- `public/` serves static assets, while `docs/`, `scripts/`, and `obrazovky/` provide documentation, automation utilities, and UI references.
- `tests/` mirrors the stack: `backend/`, `frontend/`, `e2e/`, plus shared helpers and screenshots.

## Build, Test, and Development Commands
- `npm run dev` starts the Next.js dev server on port 5600 (mirrors e2e defaults).
- `npm run build && npm run start` creates and runs a production build.
- `npm run lint` enforces the Next/ESLint rules; fix warnings before review.
- `npm run test` executes the full Vitest suite; use `test:backend`, `test:frontend`, or `test:watch` for focused runs.
- `npm run test:e2e` (and variants `:headed`, `:ui`, `:smoke`) run Playwright specs against the dev server.
- Database utilities live behind `npm run db:push`, `db:migrate`, `db:seed`, and `db:studio` (Prisma).

## Coding Style & Naming Conventions
- TypeScript throughout; prefer type-safe adapters and Zod validators in `lib/` when touching APIs.
- Follow the ESLint/TypeScript/Prettier defaults baked into Next 14 (2-space indentation, semi-colons, single quotes).
- Components and hooks use PascalCase and `useX` naming; files under `app/` match their route segment (`page.tsx`, `layout.tsx`).
- Tailwind CSS lives in `app/globals.css` and utility classes; compose via `clsx`/`tailwind-merge` instead of ad hoc strings.

## Testing Guidelines
- Unit and integration tests live beside domain folders under `tests/backend` and `tests/frontend`; name files `*.test.ts` or `*.spec.ts`.
- Use Vitest snapshots sparingly; reset Prisma via helpers in `tests/setup.ts` when touching data.
- Keep Playwright specs idempotent and scoped (see `tests/e2e/smoke`); capture new screenshots in `tests/screenshots/` when UI shifts.
- Target ≥80% coverage with `npm run test:coverage`; flag lower coverage in the PR description.

## Commit & Pull Request Guidelines
- Match the existing Conventional Commits style (`fix(scope): message`, `feat: …`, `chore:`) per `git log`.
- Squash work-in-progress history before opening a PR; keep commits focused on one concern.
- PRs should include: clear summary, linked issue or task, testing evidence (`npm run test`, e2e status), and UI screenshots when visual changes occur.
- Highlight schema or configuration changes (Prisma, env) and include migration instructions in the PR body.

## Environment & Data Notes
- Copy `.env.example` to configure secrets; align ports with `docker-compose.yml` when running services locally.
- When seeding new data, update `prisma/seed.ts` and note any breaking changes for QA or automated smoke tests.
