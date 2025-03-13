#!/bin/bash

pnpm exec playwright install 

# Start dev server in background
pnpm dev_lite 

# Function to cleanup dev server on script exit
cleanup() {
  kill $DOCKER_LOGS_PID 2>/dev/null
  kill $PLAYWRIGHT_PID 2>/dev/null
  exit 
}
trap cleanup INT TERM

# Wait for servers to be ready
echo "Waiting for dev servers..."
while true; do
  STATUS=$(curl -s -k -w "%{http_code}" https://localhost:8088/ -o /dev/null)
  if [ "$STATUS" = "200" ]; then
    break
  fi
  echo "Waiting for HTTPS server..."
  sleep 1
done
echo "HTTPS server is ready"

# Start docker logs in background
docker compose logs -f &
DOCKER_LOGS_PID=$!

while true; do
  RESPONSE=$(curl -s http://localhost:5173/send)
  if [ -n "$RESPONSE" ] && [[ "$RESPONSE" == *"<title>Thunderbird Send</title>"* ]]; then
    echo $RESPONSE
    break
  fi
  # log the response for debugging
  echo $RESPONSE
  echo "Waiting for Vite dev server..."
  sleep 1
done
echo "Vite dev server is ready"

# Run tests in parallel with docker logs
pnpm exec playwright test &
PLAYWRIGHT_PID=$!

# Wait for tests to complete
wait $PLAYWRIGHT_PID

echo "Tests finished running!"

# Kill docker logs process
kill $DOCKER_LOGS_PID

# Cleanup
cleanup
