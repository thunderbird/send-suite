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
    include: ['**/routes/*.test.{js,ts}'],
    environment: 'node',
    setupFiles: ['dotenv/config'],
  },
});
