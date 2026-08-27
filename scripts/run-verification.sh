#!/bin/bash
set -euo pipefail

cd /Users/rsn/Documents/GitHub/fyp-production/product

echo "=== FIRST RUN ==="
echo "1. lint"
npm run lint
echo "2. tsc"
npx tsc --noEmit
echo "3. jest"
npm test -- --runInBand

echo "=== Obtaining Local Configuration ==="
export NEXT_PUBLIC_SUPABASE_URL=$(cd .. && npx supabase status -o env | grep API_URL | cut -d '=' -f 2 | tr -d '"' | tr -d '\r')
export NEXT_PUBLIC_SUPABASE_ANON_KEY=$(cd .. && npx supabase status -o env | grep ANON_KEY | cut -d '=' -f 2 | tr -d '"' | tr -d '\r')
export SUPABASE_SERVICE_ROLE_KEY=$(cd .. && npx supabase status -o env | grep SERVICE_ROLE_KEY | cut -d '=' -f 2 | tr -d '"' | tr -d '\r')
export SPOTIFY_CLIENT_ID="dummy-spotify-id"
export SPOTIFY_CLIENT_SECRET="dummy-spotify-secret"

echo "4. build"
NEXT_TELEMETRY_DISABLED=1 npm run build

echo "5/6. Cypress complete e2e suite"
npm run test:e2e:local

echo "=== REPEATABILITY RUN ==="
echo "7/8. Cypress complete e2e suite (includes db reset)"
npm run test:e2e:local

echo "=== VERIFICATION GATE PASSED ==="
