#!/bin/sh
echo 'installing frontend deps 🤖'
pnpm install --no-frozen-lockfile

echo 'Starting dev server 🦄'
pnpm run dev
