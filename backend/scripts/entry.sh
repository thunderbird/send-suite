#!/bin/sh

echo 'Applying prisma migrations...'
pnpm db:update

echo 'Generating prisma client...'
pnpm db:generate


# Check if DEBUG variable is set in the .env file
if [ "$DEBUG" = "true" ]; then
    echo 'Starting dev server with debugger 🚀'
    echo 'Starting db browser on http://localhost:5555 🔎'
    pnpm debug
else
    # We should add some logic to tell if we're starting prod or dev
    echo 'Starting prod server 🚀'
    pnpm start
fi
