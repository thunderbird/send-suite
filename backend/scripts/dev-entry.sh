#!/bin/sh

echo 'Generating prisma client...'
npm run db:migrate
npm run db:generate
echo 'Starting dev server 🚀'
npm run dev