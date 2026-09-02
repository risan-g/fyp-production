# DOTWV

DOTWV is a full-stack music discovery and social platform built with Next.js, TypeScript, PostgreSQL and Supabase. Users can discover music through Spotify catalogue data, rate and review releases, follow other users and participate in threaded artist discussions.

## Engineering Highlights

- Sensitive mutations derive user identity from authenticated server sessions rather than trusting client-supplied user IDs; Zod, row-level security and PostgreSQL constraints enforce validation and authorization across layers.
- PostgreSQL migrations include partial unique indexes, CHECK constraints and hardened `SECURITY DEFINER` functions.
- A reproducible local environment resets Supabase from migrations, starts the containerised application and replaces Spotify with a deterministic local fixture service.
- GitHub Actions separately verifies static/unit checks, PostgreSQL behaviour and end-to-end flows.
- Current automated verification includes 17 Jest tests, 90 pgTAP assertions and 16 Cypress E2E tests.
- Supply-chain CI performs npm dependency auditing, blocking HIGH/CRITICAL Trivy image scans and SPDX SBOM generation.
- The application runs from a multi-stage Next.js standalone Docker image under a non-root user.

## Architecture

```text
Browser
  -> Next.js App Router
      -> Server Actions / API routes
          -> Supabase Auth
          -> PostgreSQL + RLS
          -> Supabase Storage
          -> Spotify Web API
```

During local verification, the Spotify Web API is replaced with a custom Node.js deterministic fixture service.

## Local Verification

The containerised local environment can be recreated and exercised end-to-end with a single command:

```bash
./scripts/compose-local.sh test
```

This orchestrated script:
- starts local Supabase
- resets the database and applies migrations/seed data
- builds and starts the Docker Compose application and Spotify fixture
- waits for application health
- verifies health endpoints
- runs Cypress
- tears down Compose

In GitHub Actions, the continuous integration pipeline splits verification into distinct layers:
- **Static/Unit:** `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm test -- --runInBand`, `npm run build`
- **Database:** `npx supabase start`, `npx supabase db reset`, `npx supabase test db`
- **End-to-End:** `./scripts/compose-local.sh test`

## Testing

| Layer | Tool | Verified scope |
| :--- | :--- | :--- |
| Unit | Jest | 17 tests |
| Database | pgTAP | 90 assertions |
| End-to-end | Cypress | 16 tests across 7 suites |

Cypress end-to-end tests use `scripts/fixture-server.js` to avoid reliance on live Spotify responses, providing deterministic test behaviour.

## Security

- Server-derived authenticated identity
- PostgreSQL Row-Level Security (RLS)
- PostgreSQL CHECK constraints and partial unique indexes
- Hardened `SECURITY DEFINER` search paths
- Non-root container execution
- Trivy image scanning, npm dependency auditing, and SPDX SBOM generation

## Tech Stack

- **Application:** Next.js, React, TypeScript
- **Data/Auth:** PostgreSQL, Supabase
- **Testing:** Jest, pgTAP, Cypress
- **Infrastructure:** Docker, Docker Compose, GitHub Actions
- **External API:** Spotify Web API

## Running the Application

For local end-to-end verification, use `./scripts/compose-local.sh test`. For manual development, the application can be started as follows:

### Prerequisites
Ensure you are running Node.js v18.18.0 or higher.

### 1. Installation
Clone the repository and install dependencies for the Next.js application:
```bash
cd product
npm ci
```

### 2. Environment Configuration
Create a `.env.local` file in the `product/` directory with your Supabase and Spotify credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

### 3. Development Server
Start the Next.js development server:
```bash
npm run dev
```
The platform will now be accessible at `http://localhost:3000`.
