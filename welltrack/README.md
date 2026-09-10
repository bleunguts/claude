# WellTrack

A wellness/symptom tracker. Users log symptoms, mood, medications, and habits, then view
trends. Full spec: [Documents/Requirements.md](Documents/Requirements.md).

## Quick Start

```powershell
# 1. Clone and install
git clone <repo-url>
cd welltrack
npm install --prefix server
npm install --prefix client

# 2. Configure environment
cd server
copy .env.example .env
# edit .env — see Environment Variables below
cd ../client
copy .env.example .env

# 3. Set up the database (see Database Setup)
cd ../server
npx prisma db push

# 4. Run the dev server and client (separate terminals)
npm run dev              # from server/
npm run dev --prefix ../client
```

Server runs at `http://localhost:3000`, client at `http://localhost:5173`. Check the server's up:

```bash
curl http://localhost:3000/api/health
```

## Environment Variables

Set in `server/.env` (copy from `server/.env.example`).

| Variable                   | Description                                                        |
| --------------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`              | Postgres connection string (see Database Setup)                    |
| `PORT`                      | Port the server listens on (default `3000`)                        |
| `NODE_ENV`                  | `development` / `production` / `test`                              |
| `CLIENT_URL`                | Frontend origin, used for CORS and building reset-password links   |
| `JWT_ACCESS_SECRET`         | Signing secret for access tokens — use a long random string        |
| `JWT_REFRESH_SECRET`        | Signing secret for refresh tokens — use a different random string  |
| `JWT_ACCESS_TTL`            | Access token lifetime (e.g. `15m`)                                  |
| `JWT_REFRESH_TTL`           | Refresh token lifetime (e.g. `30d`)                                 |
| `PASSWORD_RESET_TOKEN_TTL`  | How long a password reset token stays valid (e.g. `1h`)            |
| `SMTP_HOST`                 | SMTP server host (optional in dev — unset uses a console transport) |
| `SMTP_PORT`                 | SMTP server port                                                    |
| `SMTP_USER`                 | SMTP auth username                                                  |
| `SMTP_PASS`                 | SMTP auth password                                                  |
| `SMTP_FROM`                 | "From" address for outgoing emails                                  |

All required vars are validated at startup (`server/src/config/index.ts`) — the server
throws a readable error listing anything missing.

Set in `client/.env` (copy from `client/.env.example`).

| Variable        | Description                                     |
| ---------------- | ------------------------------------------------ |
| `VITE_API_URL`   | Base URL the client sends API requests to (e.g. `http://localhost:3000/api`) |

## Database Setup

The server needs a Postgres database. Two options:

**Option A — Docker (local Postgres)**

```powershell
docker compose up -d
```

Matches the default `DATABASE_URL` already in `.env.example`.

**Option B — Neon (hosted Postgres, no Docker)**

1. Create a free project at [neon.tech](https://neon.tech). Your project dashboard will look
   like `https://console.neon.tech/app/projects/<project-id>?database=<db-name>`, e.g.
   `https://console.neon.tech/app/projects/curly-meadow-18185174?database=neondb`.
2. Copy the connection string it gives you (includes `?sslmode=require`).
3. Paste it into `server/.env` as `DATABASE_URL`.

Either way, once `DATABASE_URL` is set, sync the schema:

```powershell
cd server
npx prisma db push
```

(Use `npx prisma migrate deploy` instead once real migration files exist under
`prisma/migrations/`.)

## Running the Dev Server

From `welltrack/server/`:

```powershell
npm run dev              # tsx watch src/index.ts — auto-restarts on changes
npm run build             # compile to dist/
npm run start             # node dist/index.js (run build first)
```

From `welltrack/client/`:

```powershell
npm run dev              # Vite dev server with HMR, http://localhost:5173
npm run build             # type-check and bundle to dist/
npm run preview           # preview the production build locally
```

## Available Scripts

Root (`welltrack/`):

| Script          | What it does                                      |
| ---------------- | -------------------------------------------------- |
| `npm run lint`    | Lints both `server/` and `client/`                 |
| `npm run format`  | Checks formatting with Prettier                    |
| `npm run format:write` | Applies Prettier formatting                  |
| `npm test`        | Runs the server and client test suites             |

Server (`welltrack/server/`):

| Script          | What it does                                      |
| ---------------- | -------------------------------------------------- |
| `npm run dev`     | Start dev server with hot reload                   |
| `npm run build`   | Compile TypeScript to `dist/`                      |
| `npm run start`   | Run the compiled server                            |
| `npm test`        | Run tests once (Vitest)                            |
| `npm run test:watch` | Run tests in watch mode                        |

Client (`welltrack/client/`):

| Script          | What it does                                      |
| ---------------- | -------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR                 |
| `npm run build`   | Type-check and bundle for production               |
| `npm run preview` | Preview the production build locally               |
| `npm test`        | Run tests once (Vitest + Testing Library)          |
| `npm run test:watch` | Run tests in watch mode                        |

## API Documentation

See [docs/api.md](docs/api.md) for endpoint reference and curl examples.
