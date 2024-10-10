import { sentryVitePlugin } from '@sentry/vite-plugin';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';

import fs from 'fs';
import path from 'path';

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, './package.json'), 'utf8')
);

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
          appHost: 'extension',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: {
      minify: true,
      sourcemap: true,
      outDir: 'dist/extension',
      rollupOptions: {
        // external: ["vue"],
        input: {
          extension: resolve(__dirname, 'index.extension.html'),
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
