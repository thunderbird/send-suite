import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],

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
