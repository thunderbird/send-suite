#!/bin/sh
echo 'Running prisma migrations...'
npm run db:migrate


echo 'Installing dependencies'
npm install -g pnpm
pnpm install
echo 'Generating prisma client...'
npm run db:generate

echo 'Starting dev server 🚀'
npm run dev
