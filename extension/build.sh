rm -rf dist
mkdir dist

vite build --config vite.config.lib.js
mv dist/background/* dist/

vite build --config vite.config.js
mv dist/pages/* dist/

vite build --config vite.config.service-page.js
rm -rf ../service/public/*
mv dist/service-page/* ../service/public/
# this also copies the manifest.json, popup.*, management.*
# TODO: when building, delete these files from the service/public/ dir