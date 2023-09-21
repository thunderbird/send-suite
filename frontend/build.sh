rm -rf dist
mkdir dist
mkdir dist/assets

# ### ...dunno
# vite build --config vite.config.lib.js
# mv dist/background/* dist/

### Extension UI
vite build --config vite.config.js
# mv -f dist/pages/* dist/
mv dist/pages/api dist/
cp -R dist/pages/assets/* dist/assets/
cp -R dist/pages/*.* dist/
# mv -f dist/pages/* dist/
rm -rf dist/pages

### Management page
vite build --config vite.config.management.js
cp -R dist/pages/assets/* dist/assets/
cp -R dist/pages/*.* dist/
# mv -f dist/pages/* dist/
rm -rf dist/pages

### server download page
# vite build --config vite.config.service-page.js
# rm -rf ../service/public/*
# mv dist/service-page/* ../service/public/
# this also copies the manifest.json, popup.*, management.*
# TODO: when building, delete these files from the service/public/ dir