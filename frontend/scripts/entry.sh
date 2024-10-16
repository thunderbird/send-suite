#!/bin/sh
echo 'installing frontend deps 🤖'
rm -rf node_modules
pnpm install

echo 'Starting dev server 🦄'
pnpm run dev
