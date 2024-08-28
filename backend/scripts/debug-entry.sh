#!/bin/sh
pnpm install

echo 'Applying prisma migrations...'
pnpm run db:update

echo 'Generating prisma client...'
pnpm run db:generate

echo 'Starting dev server 🚀'
echo 'Opening db browser on http://localhost:5555/'
pnpm debug
