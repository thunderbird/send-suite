// Using the "CommonJS" config from https://typestrong.org/ts-node/docs/recipes/ava/
export default {
  files: ['src/test/**/*.test.ts'],
  extensions: ['ts'],
  require: ['ts-node/register'],
};
