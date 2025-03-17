#!/bin/sh
# Warn the user this will overwrite their .env files
# If they press Y continue
echo "This script will overwrite your .env files. Press Y then Enter to continue."
read -r response
if [ "$response" != "Y" ]; then
    echo "Exiting..."
    exit 1
fi

echo "Copying .env files..."

# Copy env files
cd frontend
cp .env.sample .env
cd ../backend
cp .env.sample .env
cd ..

# Check if the first argument is "local"
if [ "$1" = "local" ]; then
    echo "Adding local flags to .env files..."
    bun run ./scripts/local.ts
fi

