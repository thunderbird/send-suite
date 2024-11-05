cd ..

mkdir frontend-source

# Get version from package.json and replace dots with hyphens
VERSION=$(node -p "require('./frontend/package.json').version.replace(/\./g, '-')")

# Copy only necessary files
cp -r frontend/src frontend-source/src
cp -r frontend/public frontend-source/public
cp frontend/package.json frontend-source/package.json
cp frontend/tsconfig.json frontend-source/tsconfig.json
cp frontend/.env.production frontend-source/.env.production
cp frontend/index.extension.html frontend-source/index.extension.html
cp frontend/index.html frontend-source/index.html
cp frontend/index.management.html frontend-source/index.management.html
cp frontend/vite.config.extension.js frontend-source/vite.config.extension.js
cp frontend/vite.config.js frontend-source/vite.config.js
cp frontend/vite.config.management.js frontend-source/vite.config.management.js
cp frontend/tailwind.config.js frontend-source/tailwind.config.js
cp frontend/postcss.config.js frontend-source/postcss.config.js
cp frontend/pnpm-lock.yaml frontend-source/pnpm-lock.yaml
cp frontend/favicon.ico frontend-source/favicon.ico
cp frontend/README.md frontend-source/README.md
mkdir frontend-source/scripts
cp frontend/scripts/build.sh frontend-source/scripts/build.sh

# Create zip for submission
zip -r frontend-source-${VERSION}.zip frontend-source
# Remove the directory
rm -rf frontend-source

mv frontend/send-suite-alpha.xpi  send-suite-alpha.xpi

echo "Finished creating frontend-source-${VERSION}.zip!"


