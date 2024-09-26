# Check if environment NODE_ENV has been set to production
if [ "$NODE_ENV" = "production" ]; then
    echo 'Starting production build 🐧'
fi

# Remove old builds
rm -rf dist && rm -rf dist-web
rm ../send-suite-alpha.xpi
rm -rf send-suite-alpha

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
# mv dist dist-extension

cd dist

# Create xpi
zip -r -FS ../send-suite-alpha.xpi * 

echo 'Add-on build complete 🎉'

echo 'Building web app 🏭'
pnpm exec vite build

echo 'Web app build complete 🎉'