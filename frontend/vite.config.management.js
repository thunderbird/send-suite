import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

import { sentryVitePlugin } from '@sentry/vite-plugin';
import fs from 'fs';

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, './package.json'), 'utf8')
);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [
      vue(),
      sentryVitePlugin({
        org: 'thunderbird',
        project: 'send-suite-frontend',
        authToken: env.VITE_SENTRY_AUTH_TOKEN,
        release: packageJson.version,
        moduleMetadata: {
          version: packageJson.version,
          appHost: 'management',
        },
      }),
    ],
    test: {
      include: ['**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      globals: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: 'dist/pages',
      sourcemap: true,
      minify: true,
      rollupOptions: {
        input: {
          management: path.resolve(__dirname, 'index.management.html'),
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: 'chunks/[name].js',
          assetFileNames: 'assets/[name].[ext]',
        },
      },
    },
  };
});
