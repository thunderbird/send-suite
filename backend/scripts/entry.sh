#!/bin/sh
# pnpm install

echo 'Applying prisma migrations...'
pnpm run db:update

echo 'Generating prisma client...'
pnpm run db:generate


# Check if DEBUG variable is set in the .env file
if [ "$DEBUG" = "true" ]; then
    echo 'Starting dev server with debugger 🚀'
    echo 'Starting db browser on http://localhost:5555 🔎'
    pnpm debug 
else
    echo 'Starting dev server 🚀'
    pnpm dev
fi
