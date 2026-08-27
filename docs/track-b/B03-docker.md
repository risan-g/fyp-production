# B03 — Docker Build & Environment Strategy

## Objective
Produce one secure, environment-neutral OCI image for DOTWV that:
- Uses a multi-stage build producing a Next.js `standalone` output.
- Runs the final application as a non-root user (`nextjs`).
- Injects runtime environment variables without requiring a rebuild, replacing build-time `NEXT_PUBLIC_` variables with runtime `DOTWV_` variables.
- Supplies `/api/health/live` and `/api/health/ready` endpoints.

## Implementation Details

### Environment Neutrality
Next.js traditionally bakes `NEXT_PUBLIC_` variables into the static bundle at build time. To achieve true environment neutrality (build once, deploy anywhere), we eliminated reliance on `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

1. **Config API**: Created `/api/config/route.ts` which serves dynamic JS reading the runtime configuration: `window.__DOTWV_CONFIG__ = { supabaseUrl: process.env.DOTWV_PUBLIC_SUPABASE_URL, ... }`.
2. **Layout Injection**: Injected `<Script src="/api/config" strategy="beforeInteractive" />` into the `RootLayout` `<body>`. This ensures the config is fetched before the React tree hydrates.
3. **Client Fallback**: Modified `src/lib/supabase/client.ts` to read from `window.__DOTWV_CONFIG__` on the client, falling back to dummy mock values during SSG build generation.

### Docker Image
- **Node Version**: 22 LTS (Alpine base)
- **Multi-Stage Build**:
  - `deps`: Installs package dependencies natively.
  - `builder`: Copies source, sets `NEXT_TELEMETRY_DISABLED=1`, and runs Next.js standalone build.
  - `runner`: Uses a minimal footprint. Runs entirely under a non-root `nextjs` user. Copies only the standalone output and static assets.
- **Standalone Output**: Enabled `output: 'standalone'` in `next.config.ts` to dramatically reduce image size and improve security by not shipping source files.

### Health Probes
Added two new endpoints to support orchestration (e.g. Kubernetes):
- `/api/health/live`: Returns `{"status":"alive"}` immediately to indicate the Node process is running.
- `/api/health/ready`: Returns `{"status":"ready", "service":"dotwv", "environment": process.env.DOTWV_ENVIRONMENT, "release": process.env.DOTWV_RELEASE_SHA}` to confirm the service is configured and ready for traffic. Added Jest tests for verification.

## Verification
- **Docker Build**: Passed cleanly, resulting in a minimal Next.js standalone image.
- **Container Testing**: Health endpoints verified successfully against the running container using local ports.
- **E2E Integration**: The rigorous Cypress test suite passed with `16/16` successful assertions, proving the dynamic environment variable hydration functions correctly under test isolation.
