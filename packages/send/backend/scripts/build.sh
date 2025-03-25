BUILD_PATH=$(pwd)/backend/build
echo $BUILD_PATH
rm -rf $BUILD_PATH
pnpm --filter send-backend --prod deploy backend/build