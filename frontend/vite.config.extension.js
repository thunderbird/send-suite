import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    minify: false,
    outDir: 'dist/extension',
    rollupOptions: {
      // external: ["vue"],
      input: {
        extension: resolve(__dirname, 'index.extension.html'),
      },
    },
  },
});
