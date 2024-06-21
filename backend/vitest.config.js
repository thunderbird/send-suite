import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['**/**/server.test.{js,ts}'],
    environment: 'node',
    setupFiles: ['dotenv/config'],
  },
});
