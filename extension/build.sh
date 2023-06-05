rm -rf dist
mkdir dist
vite build --config vite.config.lib.js
vite build --config vite.config.js
mv dist/pages/* dist/
mv dist/background/* dist/