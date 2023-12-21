#!/bin/sh
echo 'Running prisma migrations...'
npm run db:migrate --name init

echo 'Generating prisma client...'
npm run db:generate

echo 'Starting dev server 🚀'
npm run dev
