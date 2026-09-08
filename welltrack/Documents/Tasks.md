# WellTrack - Implementation Tasks

Task breakdown derived from [Documents/Requirements.md](Documents/Requirements.md). Organized by the 12-week timeline. Each task is scoped for a mid-level developer to pick up directly — see Requirements.md for full field lists and endpoint details if you need to double check something.

---

## Phase 1: Backend Foundation (Weeks 1-3)

### Project Setup
- [ ] Init Node.js + Express project with TypeScript, ESLint, Prettier
- [ ] Set up PostgreSQL locally (or via Docker) and configure connection via env vars
- [ ] Init Prisma, point `DATABASE_URL` at PostgreSQL
- [ ] Set up `.env` / `.env.example` (DB URL, JWT secrets, email provider keys)
- [ ] Set up project folder structure (routes, controllers, services, middleware, prisma)

### Database Schema (Prisma)
- [ ] `User` model: id (UUID), email (unique), password_hash, display_name, timezone (default UTC), created_at
- [ ] `Symptom` model: id, user_id (nullable = system default), name, category, is_active
- [ ] `SymptomLog` model: id, user_id, symptom_id, severity (1-10), notes, logged_at, created_at
- [ ] `MoodLog` model: id, user_id, mood_score (1-5), energy_level (1-5, optional), stress_level (1-5, optional), notes, logged_at, created_at
- [ ] `Medication` model: id, user_id, name, dosage, frequency, is_active, created_at
- [ ] `MedicationLog` model: id, user_id, medication_id, taken (boolean), taken_at, notes, created_at
- [ ] `Habit` model: id, user_id (nullable = system default), name, tracking_type (boolean|numeric|duration), unit, is_active
- [ ] `HabitLog` model: id, user_id, habit_id, value_boolean, value_numeric, value_duration (minutes), notes, logged_at, created_at
- [ ] Add composite index on `(user_id, logged_at)` for SymptomLog, MoodLog, HabitLog, and equivalent `(user_id, taken_at)` for MedicationLog
- [ ] Run initial migration (`prisma migrate dev`)
- [ ] Write seed script for default symptoms: Headache, Fatigue, Joint Pain, Muscle Pain, Nausea, Brain Fog, Dizziness, Insomnia, Anxiety, Stomach Pain, Back Pain (user_id = null)
- [ ] Write seed script for default habits: Sleep Duration (duration), Water Intake (numeric/glasses), Exercise (boolean), Alcohol (boolean), Caffeine (numeric/cups) (user_id = null)

### Auth System
- [ ] Password hashing with bcrypt on register
- [ ] `POST /api/auth/register` — create user, hash password
- [ ] `POST /api/auth/login` — verify credentials, issue JWT access token + refresh token
- [ ] `POST /api/auth/refresh` — rotate refresh token, issue new access token
- [ ] `POST /api/auth/logout` — invalidate refresh token
- [ ] `POST /api/auth/forgot-password` — generate reset token, send reset email
- [ ] `POST /api/auth/reset-password` — verify reset token, update password_hash
- [ ] Auth middleware to verify JWT and attach `user_id` to request

### User Endpoints
- [ ] `GET /api/users/me` — return profile
- [ ] `PATCH /api/users/me` — update display_name/timezone
- [ ] `DELETE /api/users/me` — cascade-delete all associated logs, symptoms, medications, habits

### Symptoms & Symptom Logs
- [ ] `GET /api/symptoms` — return system defaults + user's custom symptoms
- [ ] `POST /api/symptoms` — create custom symptom (user_id set)
- [ ] `PATCH /api/symptoms/:id` — update (e.g. rename, toggle is_active); block editing other users' or others-owned system rows
- [ ] `DELETE /api/symptoms/:id` — only allow deleting custom (user-owned) symptoms
- [ ] `GET /api/symptom-logs?startDate=&endDate=&limit=&offset=`
- [ ] `POST /api/symptom-logs` — validate severity is 1-10
- [ ] `PATCH /api/symptom-logs/:id`
- [ ] `DELETE /api/symptom-logs/:id`

### Mood Logs
- [ ] `GET /api/mood-logs?startDate=&endDate=`
- [ ] `POST /api/mood-logs` — validate mood_score 1-5, energy/stress 1-5 if present
- [ ] `PATCH /api/mood-logs/:id`
- [ ] `DELETE /api/mood-logs/:id`

### Medications & Medication Logs
- [ ] `GET /api/medications`
- [ ] `POST /api/medications`
- [ ] `PATCH /api/medications/:id`
- [ ] `DELETE /api/medications/:id`
- [ ] `GET /api/medication-logs?startDate=&endDate=`
- [ ] `POST /api/medication-logs`
- [ ] `PATCH /api/medication-logs/:id`
- [ ] `DELETE /api/medication-logs/:id`

### Habits & Habit Logs
- [ ] `GET /api/habits` — system defaults + user's custom habits
- [ ] `POST /api/habits` — custom habit with tracking_type/unit
- [ ] `PATCH /api/habits/:id`
- [ ] `DELETE /api/habits/:id` — only custom (user-owned) habits
- [ ] `GET /api/habit-logs?startDate=&endDate=`
- [ ] `POST /api/habit-logs` — validate correct value field is set based on habit's tracking_type
- [ ] `PATCH /api/habit-logs/:id`
- [ ] `DELETE /api/habit-logs/:id`

### Validation & Error Handling
- [ ] Add request validation (e.g. zod or express-validator) for all POST/PATCH bodies
- [ ] Centralized error-handling middleware returning consistent JSON error shape
- [ ] Ensure all log endpoints reject writes/reads for records not owned by the authenticated user (ownership check via `user_id`)

---

## Phase 2: Frontend Foundation (Weeks 4-6)

### App Scaffold
- [ ] Init React + TypeScript app (Vite recommended), Tailwind CSS configured
- [ ] Set up React Router with public routes (login/register) and protected routes (everything else)
- [ ] Define Tailwind theme using soft teal/sage palette (avoid clinical/harsh blues per Requirements.md Notes)
- [ ] Set up API client (fetch/axios wrapper) with base URL and auth header injection

### Auth Pages
- [ ] Register page/form
- [ ] Login page/form
- [ ] Forgot password / reset password flow pages
- [ ] Token storage (access + refresh) and silent refresh handling on 401
- [ ] `ProtectedRoute` wrapper that redirects to login if unauthenticated

### Dashboard Layout
- [ ] Dashboard page shell showing today's date
- [ ] Summary section listing what's already been logged today
- [ ] Quick-add buttons for each log type (symptom, mood, medication, habit)
- [ ] "Days logged this week" streak indicator

### Logging UI
- [ ] Shared Log Entry modal/page component (type selector, big tap-friendly rating controls, optional notes field, date/time picker defaulting to now)
- [ ] Symptom log form (symptom picker + severity 1-10 slider/buttons)
- [ ] Mood log form (mood 1-5, optional energy/stress 1-5)
- [ ] Medication log form (medication picker, taken toggle, taken_at)
- [ ] Habit log form (renders boolean/numeric/duration input based on habit's tracking_type)
- [ ] Backfill support — allow selecting a past date/time when logging
- [ ] Wire quick-add buttons and forms to their respective API endpoints

---

## Phase 3: Full Features (Weeks 7-9)

### History View
- [ ] History page: entries grouped by day, reverse chronological, scrollable/paginated
- [ ] Tap an entry to expand and edit inline (reuses Log Entry form)
- [ ] Filter control by type (symptoms / mood / meds / habits)
- [ ] Delete entry action from History view

### Trends
- [ ] `GET /api/insights/trends?type=&days=` — aggregate severity/mood/etc. over the requested window
- [ ] Trends page with date range picker (7/30/90 day presets)
- [ ] Line chart: symptom severity over time (per selected symptom)
- [ ] Line chart: mood/energy/stress over time
- [ ] Calendar heatmap showing which days have logged activity

### Settings & Customization
- [ ] Settings page shell (profile, symptoms, habits, medications, export, delete account, logout sections)
- [ ] Edit profile (display_name, timezone)
- [ ] Manage symptoms: list system + custom, add custom symptom, toggle hide/show (is_active) for system symptoms
- [ ] Manage habits: list system + custom, add custom habit (name/tracking_type/unit), toggle hide/show for system habits
- [ ] Manage medications: add/edit/remove
- [ ] Delete account flow with confirmation step, calls `DELETE /api/users/me`
- [ ] Logout action

### Export
- [ ] `GET /api/export/csv?startDate=&endDate=` — stream/generate CSV of logs in range
- [ ] "Export data" action in Settings that triggers the CSV download

---

## Phase 4: Polish & Launch (Weeks 10-12)

- [ ] Full bug-bash pass across all screens and flows
- [ ] Mobile responsiveness check on all pages (dashboard, log entry, history, trends, settings)
- [ ] Cross-browser smoke test (Chrome, Safari, Firefox)
- [ ] Timezone audit — confirm all displayed timestamps convert to the user's stored timezone, not server/UTC
- [ ] Verify `(user_id, logged_at)` indexes are in place and log list queries are paginated
- [ ] Choose hosting (Vercel, Railway, or Render) and provision production DB
- [ ] Configure production env vars/secrets, enforce HTTPS
- [ ] Deploy backend + frontend to production
- [ ] Production smoke test (register, log an entry of each type, view trends, export CSV, delete account)
- [ ] Onboard the 50 beta users

---

## Nice-to-Have / If Time Permits

Not part of MVP scope — only pick these up if the core phases above are done early.

- [ ] Daily reminder emails
- [ ] Correlation insights (e.g. "You sleep worse on days you have caffeine")
- [ ] PDF export formatted for doctor visits
- [ ] Onboarding flow for new users
