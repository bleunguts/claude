# API Reference

Base URL: `http://localhost:3000/api`

All request/response bodies are JSON. Endpoints marked "requires auth" expect
`Authorization: Bearer <accessToken>`.

### Register

POST /api/auth/register

Creates a new user account and returns an auth session (no separate login step needed).

Request:
```json
{
  "email": "sarah@example.com",
  "password": "securepass123",
  "displayName": "Sarah"
}
```

Response: 201 Created
```json
{
  "user": {
    "id": "uuid",
    "email": "sarah@example.com",
    "displayName": "Sarah",
    "timezone": "UTC",
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  "accessToken": "<jwt>",
  "refreshToken": "<opaque-token>"
}
```

Errors: `409 EMAIL_IN_USE` if the email is already registered.

Curl:
```bash
curl -k -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah@example.com",
    "password": "securepass123",
    "displayName": "Sarah"
  }'
```

### Login

POST /api/auth/login

Request:
```json
{
  "email": "sarah@example.com",
  "password": "securepass123"
}
```

Response: 200 OK (same shape as Register)

Errors: `401 INVALID_CREDENTIALS` for a bad email/password combination.

Curl:
```bash
curl -k -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah@example.com",
    "password": "securepass123"
  }'
```

### Refresh

POST /api/auth/refresh

Exchanges a valid, unused refresh token for a new access/refresh pair. The old
refresh token is revoked as part of this call (rotation).

Request:
```json
{
  "refreshToken": "<opaque-token>"
}
```

Response: 200 OK (same shape as Register)

Errors: `401 INVALID_REFRESH_TOKEN` if the token is missing, expired, or already revoked.

Curl:
```bash
curl -k -X POST "http://localhost:3000/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "<opaque-token>" }'
```

### Logout

POST /api/auth/logout

Revokes the given refresh token. Idempotent — succeeds even if the token was
already revoked or doesn't exist.

Request:
```json
{
  "refreshToken": "<opaque-token>"
}
```

Response: 204 No Content

Curl:
```bash
curl -k -X POST "http://localhost:3000/api/auth/logout" \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "<opaque-token>" }'
```

### Forgot Password

POST /api/auth/forgot-password

Always returns 200 regardless of whether the email is registered, to avoid
leaking which emails have accounts. If the email exists, a reset link is
emailed (or logged to the dev console transport if SMTP isn't configured).

Request:
```json
{
  "email": "sarah@example.com"
}
```

Response: 200 OK
```json
{
  "message": "If that email is registered, a password reset link has been sent"
}
```

Curl:
```bash
curl -k -X POST "http://localhost:3000/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{ "email": "sarah@example.com" }'
```

### Reset Password

POST /api/auth/reset-password

Applies a password reset using the token from the emailed reset link. On
success, all of the user's existing refresh tokens are revoked (forces
re-login everywhere).

Request:
```json
{
  "token": "<reset-token-from-email>",
  "newPassword": "newSecurePass456"
}
```

Response: 200 OK
```json
{
  "message": "Password has been reset"
}
```

Errors: `400 INVALID_RESET_TOKEN` if the token is missing, expired, or already used.

Curl:
```bash
curl -k -X POST "http://localhost:3000/api/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<reset-token-from-email>",
    "newPassword": "newSecurePass456"
  }'
```

## User Stats

### Get Stats

GET /api/stats (requires auth)

Aggregated statistics for the authenticated user. All windows and day-boundaries are
computed in the user's stored `timezone`, not UTC.

Response: 200 OK
```json
{
  "averageMoodScoreLast30Days": 3.5,
  "topSymptoms": [
    { "symptomId": "uuid", "name": "Headache", "count": 4 }
  ],
  "currentStreakDays": 6,
  "totalLogsByType": {
    "symptom": 42,
    "mood": 18,
    "medication": 7,
    "habit": 30
  }
}
```

- `averageMoodScoreLast30Days` — average `moodScore` over the last 30 local calendar
  days; `null` if there are no mood logs in that window.
- `topSymptoms` — up to 5 most-logged symptoms over the last 30 local calendar days,
  sorted by count descending; empty array if none.
- `currentStreakDays` — consecutive local calendar days, counting backward from today,
  with at least one log of any type. Reads `0` if nothing has been logged yet today (it
  does not fall back to counting from yesterday while today is still in progress).
- `totalLogsByType` — all-time counts per log type, not windowed.

Curl:
```bash
curl -k -X GET "http://localhost:3000/api/stats" \
  -H "Authorization: Bearer <accessToken>"
```

## Notes

- Password rules (register + reset): 8-72 characters, at least one letter and one number.
- `/auth/register`, `/auth/login`, and `/auth/forgot-password` are rate-limited.
- Replace all `<...>` placeholders above with real values from a prior response — don't commit real tokens or passwords into this file.
