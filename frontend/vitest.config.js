import { defineConfig } from 'vite';
import viteConfig from './vite.config';
import path from 'path';

export default defineConfig({
  viteConfig,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup/webcrypto.js'],
    globals: true,
    mockReset: false,
  },
});
