(pnpm version patch && \
VERSION=$(node -p "require('./package.json').version") && \
git checkout -b release/backend-${VERSION//./-} && \
git add . && \
git commit -m "chore: bump backend version to ${VERSION}" && \
git push origin release/backend-${VERSION//./-})