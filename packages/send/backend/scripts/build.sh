BUILD_PATH=$(pwd)/backend/build
echo $BUILD_PATH
rm -rf $BUILD_PATH
# Build for prod
pnpm --filter send-backend --prod deploy backend/build