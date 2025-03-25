#!/bin/sh

# Create zip for submission
if [ "$IS_CI_AUTOMATION" != "yes" ]; then
    echo 'Skipping lockfile install on CI'    
else
    # *IS* CI automation
    echo 'installing backend deps 🤖'
    pnpm install --no-frozen-lockfile
fi

# Check if environment NODE_ENV has been set to production
if [ "$NODE_ENV" = "production" ]; then
    echo 'Starting with NODE_ENV on production 🐧'
fi

echo 'Applying prisma migrations...'
pnpm db:update

echo 'Generating prisma client...'
pnpm db:generate

# Check if environment NODE_ENV has been set to production
if [ "$NODE_ENV" = "production" ]; then
    echo 'Starting prod server 🚀'
    pnpm start
else
    echo 'Starting dev server with debugger 🚀'
    echo 'Starting db browser on http://localhost:5555 🔎'
    pnpm debug
fi
