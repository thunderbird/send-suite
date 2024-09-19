import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    minify: true,
    sourcemap: 'inline',
    outDir: 'dist/extension',
    rollupOptions: {
      // external: ["vue"],
      input: {
        extension: resolve(__dirname, 'index.extension.html'),
      },
    },
  },
});
