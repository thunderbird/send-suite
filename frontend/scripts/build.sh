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

# Create a checksum for each file in the dist folder and put it inside a txt file
timestamp=$(date +"%Y%m%d%H%M%S")
find . -type f -exec sh -c 'for file; do shasum -a 1 "$file" | awk "{print substr(\$2, 3) \" - \" \$1}"; done' sh {} + > "../${timestamp}.txt"

# Check if zip file was created
cd ..

# Check if zip file was created
if ! find . -name "*.xpi" | grep -q .; then
  echo "Error: No zip files found" >&2
  exit 1
fi

echo 'Build complete 🎉'
shasum -a 256 send-suite-alpha.xpi

# unzip the xpi to check that the files are the same
cp send-suite-alpha.xpi send-suite-alpha.zip
unzip send-suite-alpha.xpi -d send-suite-alpha

# Create a checksum for each file in the unzipped folder and put it inside a txt file
cd send-suite-alpha
find . -type f -exec sh -c 'for file; do shasum -a 1 "$file" | awk "{print substr(\$2, 3) \" - \" \$1}"; done' sh {} + > "../${timestamp}-zipped.txt"

cd ..

# Create an array of SHA-1 hashes from all .txt files
hashes=($(for file in *.txt; do shasum -a 1 "$file" | awk '{print $1}'; done))

# Compare all hashes to the first one
for hash in "${hashes[@]:1}"; do
  if [[ "$hash" != "${hashes[0]}" ]]; then
    echo "Error: Files have different SHA-1 hashes. Please check the .txt files generated to see the differences." >&2
    exit 1
  fi
done

echo "All files inside the dist folder and the .xpi file have the same SHA-1 hash."
rm *.txt
rm -rf send-suite-alpha
rm send-suite-alpha.zip

echo 'Building web app 🏭'
pnpm exec vite build
