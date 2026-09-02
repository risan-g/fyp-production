# B01 Database Reproducibility

## Purpose
Establishes a robust, reproducible local database environment using Supabase CLI, fully hydrated with deterministic synthetic seed data. It also validates the schema, Row Level Security (RLS) policies, triggers, and functions through a comprehensive pgTAP test suite.

## Prerequisites
- Docker daemon must be running (e.g., Docker Desktop).
- Node.js environment installed.
- Supabase CLI available (`npm i -D supabase`).

## Safety Boundaries
**LOCAL ONLY.** All commands described in this document must strictly target the local Docker containers. 
- **DO NOT** use the `--linked` flag.
- **DO NOT** run `supabase db push`.
- **DO NOT** use production data or real Spotify credentials in local environments.

## Operations

### How to Start Local Supabase
Start the local stack:
```bash
npx supabase start
```
This spins up PostgreSQL, Auth (GoTrue), Storage, and the API endpoints locally on specific ports (e.g., DB on `54322`, API on `54321`).

### Clean Local Database Reset
A clean reset purges local data, re-applies all migrations in chronological order, and executes `supabase/seed.sql`:
```bash
npx supabase db reset
```

### Running Database Tests
To run the full suite of pgTAP tests against the local database:
```bash
npx supabase test db
```

### Stopping the Local Stack
To stop the local containers without destroying volume data:
```bash
npx supabase stop
```

## Seed Data & Synthetic Users
The `seed.sql` script deterministically loads fake users, profiles, artist follows, social graphs, walls, comments, posts, and reviews.

**Available Local Accounts (For Local Dev Only):**
- **User 1 (Public):** `user1@local.test` | Password: `password123`
- **User 2 (Public):** `user2@local.test` | Password: `password123`
- **User 3 (Public):** `user3@local.test` | Password: `password123`
- **User 4 (Private):** `user4@local.test` | Password: `password123`

> [!WARNING]
> Synthetic login credentials must **NEVER** be reused in production or staging environments. They are strictly for local deterministic testing.

## Verification & Known Limitations
Successful verification is defined by:
1. All 7 historical migrations applying successfully.
2. `seed.sql` executing without error.
3. 100% of the pgTAP tests passing.
4. A deterministic state remaining after multiple clean resets.

**Known Limitations:**
- **Storage Uploads:** pgTAP tests verify the RLS policies and bucket configurations. Actual binary image uploads are deferred to higher-level integration or End-to-End (Cypress) testing.
- **Local Gateway Recovery:** During observed local verifications, the public API gateway (Kong) became unavailable after a heavy initial database reset. Running `npx supabase stop` followed by `npx supabase start` successfully restored the local stack, allowing public Auth and REST requests to succeed. This is an observed local recovery procedure, not necessarily required for every reset.

## Immutability Exceptions

### Migration 1 (`20260806214629_remote_schema.sql`)
- **Original Blob Hash:** `d2aef743862916ffb388617ae2ebd3f2660e6c52`
- **Date of Repair:** 2026-08-27
- **Exact Statements Removed:**
  1. `DROP EXTENSION pg_net;`
  2. `CREATE ROLE supabase_privileged_role;`
  3. `GRANT supabase_privileged_role TO postgres;`
  4. Nine `ALTER DEFAULT PRIVILEGES` statements (lines 13–29) configuring baseline grants for `anon`, `authenticated`, and `service_role`.
- **Why they were platform-owned:** These statements represented Supabase cluster-level configuration and platform bootstrap state rather than application schema. They collide with the state already provided by a clean local Supabase 17 instance.
- **Why a later migration could not fix it:** The execution crashed *during* this baseline migration due to `supabase_privileged_role` already existing, thereby blocking the entire reset process. A later forward migration would never be reached.
- **Confirmation:** No DOTWV application schema object, function, constraint, index, or policy was intentionally changed. Production was not contacted.
- **Rollback:** The original Git blob hash is preserved. The exact original file can be restored using normal Git history or `git restore` while the repair remains uncommitted.
- **Risks:** The historical source file now diverges from the file originally applied in production. This could theoretically cause a tracking-hash mismatch on the next deployment if the production migration tracker enforces byte-for-byte immutability on already-applied historical migrations.
- **Verification Evidence:** The local database successfully completed a clean reset (`npx supabase db reset`) and passed 100% of the pgTAP test suite (89 assertions).
