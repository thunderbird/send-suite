(pnpm version patch && \
wait && \
VERSION=$(node -p "require('./package.json').version") && \
wait && \
git checkout -b release/frontend-${VERSION//./-} && \
wait && \
git add . && \
wait && \
git commit -m "chore: bump frontend version to ${VERSION}" && \
wait && \
git push origin release/frontend-${VERSION//./-})