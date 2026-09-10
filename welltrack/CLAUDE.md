# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

WellTrack: a wellness/symptom tracker. Users log symptoms, mood, medications, and habits,
then view trends. Full product spec is in [Documents/Requirements.md](Documents/Requirements.md);
the task breakdown (in progress) is in [Documents/Tasks2.md](Documents/Tasks2.md). Currently
only the backend project scaffold and a `/api/health` endpoint exist — most routes in the
requirements doc are not implemented yet.

**Layout:** an npm workspace-style split with no npm workspaces config — `server/` and
`client/` are separate npm packages, each with their own `package.json`, `node_modules`, and
ESLint config, tied together by the root `package.json` here, which only holds shared
lint/format tooling and delegates `lint`/`test` to the subpackages via `--prefix`.

- `server/` — Express 5 + TypeScript API, ESM (`"type": "module"`, so relative imports need
  explicit `.js` extensions even in `.ts` files). Prisma 7 (`@prisma/client` +
  `@prisma/adapter-pg`) against PostgreSQL.
- `client/` — React frontend, not yet scaffolded beyond an ESLint config and empty
  `package.json`.
- `eslint.config.base.mjs` — shared flat ESLint config (`@eslint/js` + `typescript-eslint` +
  `eslint-config-prettier`, in that order — Prettier's config must stay last).
  `server/eslint.config.js` and `client/eslint.config.js` both just import it and layer on
  `globals.node` / `globals.browser`.

## Commands

Run from this directory (`welltrack/`) unless noted.

```powershell
# Postgres (required for the server; matches server/.env.example)
docker compose up -d

# Server (from welltrack/server/)
npm run dev              # tsx watch src/index.ts
npm run build             # tsc -> dist/
npm run start             # node dist/index.js (run build first)
npm test                  # vitest run
npm test -- path/to/file.test.ts   # single test file
npm run test:watch

# Lint / format (from welltrack/, applies to both server/ and client/)
npm run lint
npm run format             # prettier --check
npm run format:write
```

The server reads config through `server/src/config/index.ts`, which validates
`process.env` with a Zod schema at startup and throws with a readable list of issues if
required vars (`DATABASE_URL`, `CLIENT_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) are
missing. Copy `server/.env.example` to `server/.env` before running `dev`/`build`/tests that
touch config.

## Server architecture

Layering is strict: `routes/` → `controllers/` → `services/` → `lib/prisma.ts`. Routes only
wire an HTTP verb+path to a controller function; controllers extract request data and shape
the response; services hold the actual logic and are what tests mock/exercise (see
`server/src/routes/health.routes.test.ts`, which mocks the service layer and hits the route
through `supertest`). `createApp()` in `server/src/app.ts` builds the Express app
(`express.json()` + mounting route routers under `/api`); `src/index.ts` is the only file
that calls `.listen()`, which is what lets tests import `app` without binding a port.

Prisma client is generated to `server/src/generated/prisma/` (custom `output` in
`prisma/schema.prisma` — not the default `node_modules/.prisma`), and is gitignored/lint-ignored.
Regenerate after changing the schema (`npx prisma generate`, or `prisma migrate dev` which
regenerates automatically). `src/lib/prisma.ts` caches the client on `globalThis` outside
production to survive `tsx watch` hot-reloads without exhausting Postgres connections.

The `Symptom`/`Habit` data model (see Requirements.md) uses a nullable `user_id` to mean
"system default, shown to every user" vs. a real `user_id` for a user's custom entry — carry
that convention through when implementing the corresponding endpoints. Every log table
(`SymptomLog`, `MoodLog`, `HabitLog`, `MedicationLog`) is expected to be indexed on
`(user_id, logged_at)` (or `(user_id, taken_at)` for medication logs) per the requirements
doc's Notes section.

## Git Workflow

When completing tasks from TASKS2.md:
1. Create a new branch named `feature/<task-number>-<brief-description>` before starting work
2. Make atomic commits with conventional commit messages:
feat: for new features
fix: for bug fixes
docs: for documentation
test: for tests
refactor: for refactoring
3. After completing a task, create a pull request with:
A descriptive title matching the task
A summary of changes made
Any testing notes or considerations
4. Update the task checkbox in TASKS2.md to mark it complete

## Testing Requirements
Before marking any task as complete:
1. Write unit tests for new functionality
2. Run the full test suite with: `npm test`
3. If tests fail:
 - Analyze the failure output
 - Fix the code (no the tests, unless tests are incorrect)
 - Re-run tests until all pass
4. For API endpoints, include integration tests that verify:
 - Success responses with valid input
 - Authentication requirements
 - Edge cases
## Test Commands
- Backend tests: `cd backend && npm test`
- Frontend tests: `cd frontend && npm test`
- Run specific test file: `npm test -- path/to/test.ts`
- Run test matching pattern: `npm test -- --grep "pattern"`

