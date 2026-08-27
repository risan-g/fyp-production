#!/bin/bash
set -euo pipefail

# Safely resolve repository root
REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$REPO_ROOT"

echo "=== Ensuring Next.js is built ==="
(cd product && NEXT_TELEMETRY_DISABLED=1 npm run build)

echo "=== Obtaining Local Supabase Configuration ==="
# No eval, parse safely
export NEXT_PUBLIC_SUPABASE_URL=$(npx supabase status -o env | grep API_URL | cut -d '=' -f 2 | tr -d '"' | tr -d '\r')
export NEXT_PUBLIC_SUPABASE_ANON_KEY=$(npx supabase status -o env | grep ANON_KEY | cut -d '=' -f 2 | tr -d '"' | tr -d '\r')
export SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status -o env | grep SERVICE_ROLE_KEY | cut -d '=' -f 2 | tr -d '"' | tr -d '\r')

# Dummy Spotify isolation
export SPOTIFY_CLIENT_ID="dummy-spotify-id"
export SPOTIFY_CLIENT_SECRET="dummy-spotify-secret"
export SPOTIFY_API_BASE_URL="http://127.0.0.1:3001"
export SPOTIFY_ACCOUNTS_BASE_URL="http://127.0.0.1:3001"

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "ERROR: Could not obtain Supabase configuration. Is the local stack running?"
  exit 1
fi

echo "=== Resetting Local Database ==="
npx supabase db reset

echo "=== Starting Mock Spotify Server ==="
node scripts/fixture-server.js &
FIXTURE_PID=$!

echo "=== Starting Next.js Production Server Locally ==="
cd product
PORT=3000 npm run start -- -H 127.0.0.1 -p 3000 &
NEXT_PID=$!

function cleanup {
  echo "=== Cleaning up ==="
  if kill -0 $NEXT_PID 2>/dev/null; then
    kill -TERM $NEXT_PID
    wait $NEXT_PID || true
  fi
  if kill -0 $FIXTURE_PID 2>/dev/null; then
    kill -TERM $FIXTURE_PID
    wait $FIXTURE_PID || true
  fi
}
trap cleanup EXIT INT TERM

echo "Waiting for Next.js to be ready..."
# Use an observable wait strategy instead of arbitrary sleep
READY=0
for i in {1..30}; do
  if curl -s http://127.0.0.1:3000 > /dev/null; then
    READY=1
    break
  fi
  sleep 1
done

if [ $READY -eq 0 ]; then
  echo "ERROR: Next.js server failed to become ready within 30 seconds."
  exit 1
fi

echo "=== Running Cypress Tests ==="
npx cypress run

echo "=== Cypress run complete ==="
