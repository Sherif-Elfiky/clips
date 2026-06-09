#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/services"

# Start the API server in the background and ensure it is stopped on exit.
node server.js &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

# Wait for the server to become healthy before running the workers.
echo "Waiting for server to be ready..."
for _ in $(seq 1 30); do
  if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
    echo "Server is ready."
    break
  fi
  sleep 1
done

# Discover and queue a video, then submit queued videos to OpusClip.
node workers/fetchurl.js
node workers/opusapi.js
