#!/bin/sh
echo 'Applying prisma migrations...'
npm run db:update

echo 'Generating prisma client...'
npm run db:generate

echo 'Starting dev server 🚀'
npm run debug
