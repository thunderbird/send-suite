#!/bin/bash

pnpm exec playwright install 

# Start dev server in background
pnpm dev_lite &
# DEV_PID=$!

# Function to cleanup dev server on script exit
cleanup() {
#   kill $DEV_PID
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

# Run tests
pnpm exec playwright test

# Cleanup
cleanup
