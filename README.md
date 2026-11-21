# باشگاه شب قهرمانان

Next.js 16 application backed exclusively by PostgreSQL. Gym forms create visit requests; a trainer reservation is one trainer, one Gregorian calendar date, and one configured slot.

## Setup

1. Use Node.js 20.9+ and PostgreSQL 14+.
2. Copy `.env.example` to `.env.local` and replace every placeholder.
3. Run `npm ci`, `npm run db:migrate`, then `npm run dev`.

Required production variables are `DATABASE_URL`, `AUTH_SECRET` (32+ characters), `ADMIN_USERNAME`, and `ADMIN_PASSWORD_HASH`. Set `DATABASE_SSL=require` when verified TLS is required. Set `TRUST_PROXY=true` only when the app is reachable solely through a trusted reverse proxy that overwrites forwarding headers. Generate the password hash with `npm run hash-password -- "strong password"`.

## Database

`npm run db:migrate` applies ordered SQL files from `migrations/` transactionally and records them in `schema_migrations`. The partial unique index on `(trainer_id, booking_date, slot_key)` for every non-cancelled row is the final double-booking guard.

For a controlled one-time import, first sanitize/export a legacy JSON file outside the repository, then run `npm run db:import-legacy -- C:\path\legacy.json`. Only canonical ISO booking dates are imported; ambiguous Persian display dates and unknown trainers are skipped.

## Verification

Run `npm run architecture:check`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. For PostgreSQL tests, migrate an empty disposable database and run `npm run test:integration` with its `DATABASE_URL` set.

## Production and operations

### Admin account and sessions

Admin sign-in is available at `/admin`. A successful sign-in creates a 30-day
HttpOnly, SameSite=Lax cookie (Secure in production) backed by a hashed session
token in PostgreSQL. Closing the panel, refreshing, returning to the website, or
restarting the application preserves sign-in. Explicit account logout revokes
the session on the server and clears the cookie. Use HTTPS in production.

The **تنظیمات حساب مدیر** section changes the username and/or password after
verifying the current password. New passwords must contain 12–128 characters.
Leave both new-password fields empty to change only the username. Changes and
session rotation are transactional: old sessions are revoked, and this browser
receives a new session. Passwords are stored as salted scrypt hashes.

`ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` bootstrap the account once on its first
login. Subsequent panel edits are stored in `admin_account` and survive restarts;
changing the environment does not overwrite the existing account. Migrate the
database before starting the updated application. Admin integration tests run only
when the database name ends with `_test` and must use a disposable database.

Recommended topology: Internet → Nginx → one Next.js Node process → PostgreSQL. The in-process rate limiter is intentionally scoped to one application process. Run the built app with `npm run build && npm start`. Health monitoring can call `GET /api/health`.

Daily backup: `pg_dump --format=custom --file=backups/gym-YYYY-MM-DD.dump "$DATABASE_URL"`. Restore to an empty database with `pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" backups/gym-YYYY-MM-DD.dump`. Encrypt backups, keep them outside Git, test restores regularly, and retain at least 14 daily copies plus 3 monthly copies.
