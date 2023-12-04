#!/bin/sh


echo 'Installing dependencies'
npm install -g pnpm
pnpm install
echo 'Generating prisma client...'
npm run db:generate
echo 'Starting dev server 🚀'
npm run dev