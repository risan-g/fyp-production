# B04 — Docker Compose Implementation and Verification

## Objective
Implement a safe, deterministic Docker Compose workflow for local development and E2E verification of the DOTWV Next.js application alongside the local Spotify fixture server. 

## Architecture & Service Responsibilities
- **app (`dotwv-app-compose`)**: Runs the DOTWV Next.js standalone application. Depends on the fixture service being healthy.
- **fixture (`dotwv-fixture-compose`)**: Runs the mocked Spotify API fixture server.
- **Supabase**: Remains entirely managed by the native Supabase CLI (`npx supabase start`). Docker Compose simply connects the application to the existing Supabase docker network dynamically. This ensures database state, migrations, and Auth are handled purely through the official Supabase lifecycle, avoiding the complexity of self-hosting the platform components in Compose.

## Network Topology
- **Internal Compose Network (`dotwv_internal`)**: Used for `app` to `fixture` communication.
- **External Supabase Network (`supabase_network_...`)**: Discovered dynamically by the orchestration script. The `app` container joins this network to communicate natively with Supabase components (e.g. hitting `http://kong:8000` for server-side auth flows).

*Note*: The browser Supabase URL remains `http://127.0.0.1:54321` (public gateway) while the server Supabase URL is `http://kong:8000` (internal network). This split is intentional and mimics production, where client components hit public endpoints and server components hit internal gateways.

## Secret Handling & Environment Variables
- Local keys are dynamically extracted from `npx supabase status -o env`.
- Secrets are NEVER printed to stdout or committed to Git.
- Configuration is written to a temporary `.env` file (`/tmp/.dotwv.compose.env`), which is mounted by Compose. The orchestration script securely deletes this file upon exit (trap INT TERM EXIT).
- Core Environment Variable Names configured: `DOTWV_PUBLIC_SUPABASE_URL`, `DOTWV_SERVER_SUPABASE_URL`, `DOTWV_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_API_BASE_URL`, `SPOTIFY_ACCOUNTS_BASE_URL`, `DOTWV_ENVIRONMENT`, `DOTWV_RELEASE_SHA`.

## Exact Commands

```bash
# Start the local compose stack
npm run compose:local:up

# Tear down the local compose stack
npm run compose:local:down

# Run the full automated test suite (resets db, spins up compose, runs Cypress, tears down)
npm run compose:local:test
```

## Health-check Behaviour
- `fixture` uses a lightweight HTTP check via `wget -qO- http://127.0.0.1:3001` every 2 seconds.
- `app` uses a lightweight Node HTTP check hitting `/api/health/ready` every 3 seconds. Node is used as `wget` and `curl` are excluded from the final `node:22-bullseye-slim` runner layer.

## Cleanup and Troubleshooting
- The `down` command cleans up Compose containers and networks.
- Supabase containers and data are strictly left intact. State resets happen safely and explicitly via `npx supabase db reset`.
- If health checks fail, `compose:local:test` automatically dumps logs and calls teardown before exiting.

## Mac ARM64 vs Ubuntu AMD64 Considerations
- `node:22-bullseye-slim` and `node:22-alpine` fully support multi-arch manifest resolution and run natively on Apple Silicon (ARM64) and Linux hosts (AMD64).
- The `fetch` mechanism and core network logic rely on reliable Node bindings that don't vary significantly between ARM/x86 architectures.
- The workflow intentionally avoids binding host IPs dynamically via tricky MacOS networking (e.g., `host.docker.internal`), instead relying on true Compose/Docker bridge networking which behaves consistently on Linux and macOS.

## Scope Limitation
This compose workflow is strictly for local and CI/CD verification environments. It is not a production stack. Production deployment uses a managed orchestrator or PaaS (like Vercel) alongside managed Supabase projects.
