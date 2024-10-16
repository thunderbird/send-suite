#!/bin/sh
echo 'installing frontend deps 🤖'
pnpm install --frozen-lockfile

echo 'Starting dev server 🦄'
pnpm run dev
