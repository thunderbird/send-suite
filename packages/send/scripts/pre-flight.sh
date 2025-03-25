#!/bin/bash

# Check if Bun is installed
if command -v bun &> /dev/null
then
    echo "✅ Bun is installed."
    # Run your post-install script here
    bun run scripts/envs.ts
else
    echo "Bun is not installed. Please check docs for installation details."
    exit 1
fi

# Make sure prisma types are available for development
cd backend && pnpm db:generate