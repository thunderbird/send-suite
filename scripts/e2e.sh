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
while ! curl -s -k https://localhost:8088/ > /dev/null; do
  sleep 1
done
echo "HTTPS server is ready"

while ! curl -s http://localhost:5173/send > /dev/null; do
  sleep 1
done
echo "Vite dev server is ready"

# Run tests
pnpm exec playwright test

# Cleanup
cleanup
