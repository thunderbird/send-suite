#!/bin/sh

echo 'Installing dependencies'
npm install -g pnpm
pnpm install

echo 'Starting dev server 🦄'
pnpm run dev
