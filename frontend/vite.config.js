import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  test: {
    include: ['**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // environment: 'jsdom',
    globals: true,
    // setupFiles: 'src/setupTests.ts'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
