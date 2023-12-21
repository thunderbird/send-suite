rm -rf dist
mkdir dist
mkdir dist/assets

### this should get copied automatically, when compiling a page
cp -R public/* dist/

### Extension background.js
# skipping for now, can't seem to build a version that doesn't leave
# `import` or `process` in the output
#
# vite build --config vite.config.background.js
# mv dist/background/* dist/
# rm -rf dist/background


### Extension UI
vite build --config vite.config.extension.js
cp -R dist/extension/assets/* dist/assets/
cp -R dist/extension/*.* dist/
rm -rf dist/extension

### old extension UI
# vite build --config vite.config.js
# # mv -f dist/pages/* dist/
# mv dist/pages/api dist/
# cp -R dist/pages/assets/* dist/assets/
# cp -R dist/pages/*.* dist/
# # mv -f dist/pages/* dist/
# rm -rf dist/pages

### Management page, commenting out for now
vite build --config vite.config.management.js
cp -R dist/pages/assets/* dist/assets/
cp -R dist/pages/*.* dist/
rm -rf dist/pages

### server download page
# vite build --config vite.config.service-page.js
# rm -rf ../service/public/*
# mv dist/service-page/* ../service/public/
# this also copies the manifest.json, popup.*, management.*
# TODO: when building, delete these files from the service/public/ dir