import { config } from 'dotenv';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    // this is a temporary config to use vite on routes tests
    include: ['**/**/*.test.{js,ts}'],
    exclude: ['**/build/**', '**/node_modules/**'],
    environment: 'node',
    setupFiles: ['dotenv/config'],
    env: {
      ...config({ path: './env' }).parsed,
    },
  },
});
