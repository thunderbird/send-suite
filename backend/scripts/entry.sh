#!/bin/sh

# <debug>
echo '# curl -I https://mozilla.org/'
curl -I https://mozilla.org/
# </debug>

echo 'Applying prisma migrations...'
pnpm run db:update

echo 'Generating prisma client...'
pnpm run db:generate

echo 'Starting dev server 🚀'
pnpm run dev
