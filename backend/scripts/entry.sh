#!/bin/sh

echo 'Applying prisma migrations...'
pnpm db:update

echo 'Generating prisma client...'
pnpm db:generate

# Check if environment NODE_ENV has been set to production
if [ "$NODE_ENV" = "production" ]; then
    echo 'Starting prod server 🚀'
    pnpm start
fi

echo 'Starting dev server with debugger 🚀'
echo 'Starting db browser on http://localhost:5555 🔎'
pnpm debug

