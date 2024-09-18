# Check if environment NODE_ENV has been set to production
if [ "$NODE_ENV" = "production" ]; then
    echo 'Starting production build 🐧'
fi

# Remove old builds
rm -rf dist
rm -rf dist-extension

mkdir -p dist/assets

### this should get copied automatically when compiling a page
cp -R public/* dist/

### Extension UI
vite build --config vite.config.extension.js
cp -R dist/extension/assets/* dist/assets/
cp -R dist/extension/*.* dist/
rm -rf dist/extension

### Management page, commenting out for now
vite build --config vite.config.management.js
cp -R dist/pages/assets/* dist/assets/
cp -R dist/pages/*.* dist/
rm -rf dist/pages

### Rename dist folder to extension
mv dist dist-extension

# Create xpi
cd dist-extension
zip -r -FS ../send-suite-alpha.xpi * --exclude '*.git*'

# Check if zip file was created
cd ..
if ! find . -name "*.xpi" | grep -q .; then
  echo "Error: No zip files found" >&2
  exit 1
fi

echo 'Building web app 🏭'
pnpm exec vite build
