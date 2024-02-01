import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // `https: true` gives `Error code: SSL_ERROR_NO_CYPHER_OVERLAP`
    // https: true,
    proxy: {
      // `secure: false` seems to do nothing
      // secure: false,
      '/echo': 'http://localhost:8080',
      '/api': 'http://localhost:8080',
      '/lockbox/fxa': 'http://localhost:8080',
    },
  },
  test: {
    include: ['**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // don't use jsdom - it doesn't implement webcrypto
    // environment: 'jsdom',
    // setupFiles: ['./testSetup.js'],
    globals: true,
    setupFiles: ['vitest-localstorage-mock'],
    mockReset: false,
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
  },
});
