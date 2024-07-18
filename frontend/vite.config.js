import { sentryVitePlugin } from '@sentry/vite-plugin';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    sentryVitePlugin({
      org: 'thunderbird',
      project: 'send-suite-frontend',
      authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
    }),
  ],
  server: {
    // `https: true` gives `Error code: SSL_ERROR_NO_CYPHER_OVERLAP`
    // https: true,
    proxy: {
      // `secure: false` seems to do nothing
      // secure: false,
      '/echo': 'http://localhost:8080',
      '/api': 'http://localhost:8080',
      '/lockbox/fxa': 'http://backend:8080', // Using `backend` per the docker network name
      '/login-success.html': 'http://backend:8080', // Using `backend` per the docker network name
      '/login-failed.html': 'http://backend:8080', // Using `backend` per the docker network name
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist/pages',
    rollupOptions: {
      // input: {
      //   // background: resolve(__dirname, "src/background.js"),
      //   "extension-ui": resolve(__dirname, "index.extension-ui.html"),
      //   "extension-settings": resolve(
      //     __dirname,
      //     "index.extension-settings.html"
      //   ),
      //   // testpage: resolve(__dirname, "index.test.html"),
      //   // management: resolve(__dirname, "index.management.html"),
      //   // stats: resolve(__dirname, 'index.stats.html'),
      //   // options: resolve(__dirname, 'index.options.html'),
      //   // popup: resolve(__dirname, 'index.popup.html'),
      // },
    },
    sourcemap: true,
  },
});
