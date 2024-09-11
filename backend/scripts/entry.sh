#!/bin/sh

echo "Paging Mozilla..."
curl -i https://accounts.stage.mozaws.net/

echo "Paging Sentry..."
curl -i https://85b7b08be94b8991ed121578d807f755@o4505428107853824.ingest.us.sentry.io/4507567071232000/

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
    echo 'Starting dev server 🚀'
    pnpm dev
fi
