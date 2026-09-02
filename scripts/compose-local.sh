#!/bin/bash
set -euo pipefail

REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$REPO_ROOT"

ENV_FILE="/tmp/.dotwv.compose.env"

function cleanup {
  rm -f "$ENV_FILE"
}
trap cleanup EXIT INT TERM

function check_prereqs {
  if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: Docker is required but not installed or running."
    exit 1
  fi
  if ! docker compose version >/dev/null 2>&1; then
    echo "ERROR: Docker Compose v2 is required."
    exit 1
  fi
}

function ensure_supabase {
  local status_output
  if ! status_output=$(npx supabase status 2>/dev/null); then
    echo "Starting local Supabase stack..."
    npx supabase start
  fi
}

function prepare_env {
  ensure_supabase

  export SUPABASE_NETWORK=$(docker network ls --format '{{.Name}}' | grep supabase_network | head -n 1 || true)
  if [ -z "$SUPABASE_NETWORK" ]; then
    echo "ERROR: Could not find active Supabase network."
    exit 1
  fi

  local PUBLIC_URL="http://127.0.0.1:54321"
  local SERVER_URL="http://kong:8000"
  local ANON_KEY=$(npx supabase status -o env | grep ANON_KEY | cut -d '=' -f 2 | tr -d '"' | tr -d '\r')
  local SERVICE_KEY=$(npx supabase status -o env | grep SERVICE_ROLE_KEY | cut -d '=' -f 2 | tr -d '"' | tr -d '\r')

  if [ -z "$ANON_KEY" ] || [ -z "$SERVICE_KEY" ]; then
    echo "ERROR: Failed to obtain Supabase keys."
    exit 1
  fi

  touch "$ENV_FILE"
  chmod 600 "$ENV_FILE"

  cat << EOF > "$ENV_FILE"
DOTWV_PUBLIC_SUPABASE_URL=$PUBLIC_URL
DOTWV_SERVER_SUPABASE_URL=$SERVER_URL
DOTWV_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY
SPOTIFY_CLIENT_ID=dummy-spotify-id
SPOTIFY_CLIENT_SECRET=dummy-spotify-secret
SPOTIFY_API_BASE_URL=http://fixture:3001
SPOTIFY_ACCOUNTS_BASE_URL=http://fixture:3001
DOTWV_ENVIRONMENT=compose-local
DOTWV_RELEASE_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
EOF

  export DOTWV_ENV_FILE="$ENV_FILE"
}

function cmd_up {
  prepare_env
  docker compose up -d --build
  echo "Services started."
}

function cmd_down {
  # Don't require Supabase to be running just to tear down our compose
  export SUPABASE_NETWORK=$(docker network ls --format '{{.Name}}' | grep supabase_network | head -n 1 || echo "supabase_network_fallback")
  export DOTWV_ENV_FILE="/dev/null"
  docker compose down
}

function cmd_logs {
  export SUPABASE_NETWORK=$(docker network ls --format '{{.Name}}' | grep supabase_network | head -n 1 || echo "supabase_network_fallback")
  export DOTWV_ENV_FILE="/dev/null"
  docker compose logs -f
}

function cmd_status {
  export SUPABASE_NETWORK=$(docker network ls --format '{{.Name}}' | grep supabase_network | head -n 1 || echo "supabase_network_fallback")
  export DOTWV_ENV_FILE="/dev/null"
  docker compose ps
}

function cmd_test {
  check_prereqs
  ensure_supabase
  
  echo "=== Resetting local database ==="
  npx supabase db reset
  
  prepare_env
  echo "=== Starting Compose services ==="
  docker compose up -d --build
  
  echo "=== Waiting for healthy services ==="
  local ready=0
  for i in {1..45}; do
    local state=$(docker compose ps --format '{{.Health}}' app | grep -v '^$' || true)
    if [ "$state" = "healthy" ]; then
      ready=1
      break
    fi
    sleep 2
  done
  
  if [ $ready -eq 0 ]; then
    echo "ERROR: Services failed to become healthy."
    docker compose logs
    cmd_down
    exit 1
  fi
  
  echo "=== Verifying Health Endpoints ==="
  echo "GET /api/health/live:"
  if ! curl -sf http://localhost:3000/api/health/live; then
    echo "ERROR: /api/health/live failed"
    cmd_down
    exit 1
  fi
  echo ""
  
  echo "GET /api/health/ready:"
  if ! curl -sf http://localhost:3000/api/health/ready; then
    echo "ERROR: /api/health/ready failed"
    cmd_down
    exit 1
  fi
  echo ""
  
  echo "=== Running Cypress ==="
  cd "$REPO_ROOT/product"
  npx cypress run
  
  cd "$REPO_ROOT"
  echo "=== Cleaning up ==="
  cmd_down
}

COMMAND=${1:-""}

case "$COMMAND" in
  up)
    check_prereqs
    cmd_up
    ;;
  down)
    cmd_down
    ;;
  test)
    cmd_test
    ;;
  status)
    cmd_status
    ;;
  logs)
    cmd_logs
    ;;
  *)
    echo "Usage: $0 {up|down|test|status|logs}"
    exit 1
    ;;
esac
