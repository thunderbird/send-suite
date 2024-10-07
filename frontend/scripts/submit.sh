cd ..

mkdir frontend-source

# Copy only necessary files
cp -r frontend/src frontend-source/src
cp -r frontend/public frontend-source/public
cp frontend/package.json frontend-source/package.json
cp frontend/tsconfig.json frontend-source/tsconfig.json
cp frontend/.env.production frontend-source/.env.production
cp frontend/index.extension.html frontend-source/index.extension.html
cp frontend/index.html frontend-source/index.html
cp fontend/vite.config.extension.js frontend-source/vite.config.extension.js
cp frontend/vite.config.js frontend-source/vite.config.js
cp frontend/management.json frontend-source/management.json
cp frontend/tailwind.config.js frontend-source/tailwind.config.js
cp frontend/postcss.config.js frontend-source/postcss.config.js
cp frontend/pnpm-lock.yaml frontend-source/pnpm-lock.yaml
cp frontend/favicon.ico frontend-source/favicon.ico
cp frontend/README.md frontend-source/README.md

# Create zip for submission
zip -r frontend-source.zip frontend-source
# Remove the directory
rm -rf frontend-source

mv frontend/send-suite-alpha.xpi  send-suite-alpha.xpi

echo "Finished creating frontend-source.zip!"


