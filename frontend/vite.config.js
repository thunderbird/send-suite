import { sentryVitePlugin } from '@sentry/vite-plugin';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { packageJson, sharedViteConfig } from './sharedViteConfig';
import { getEnvironmentName } from './src/lib/config';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const SERVER_BASE_URLS = {
    // backend is the docker network name by default
    development: 'http://backend:8080',
    production: env.VITE_SEND_SERVER_URL,
  };

  const SERVER_BASE_URL = SERVER_BASE_URLS[mode];

  return {
    ...sharedViteConfig,
    plugins: [
      vue(),
      sentryVitePlugin({
        org: 'thunderbird',
        project: 'send-suite-frontend',
        authToken: env.VITE_SENTRY_AUTH_TOKEN,
        release: packageJson.version,
        moduleMetadata: {
          version: packageJson.version,
          environment: getEnvironmentName(env),
        },
      }),
    ],
    server: {
      // `https: true` gives `Error code: SSL_ERROR_NO_CYPHER_OVERLAP`
      // https: true,
      proxy: {
        // `secure: false` seems to do nothing
        // secure: false,
        '/lockbox/fxa': SERVER_BASE_URL, // Using `backend` per the docker network name
        '/login-success.html': SERVER_BASE_URL, // Using `backend` per the docker network name
        '/login-failed.html': SERVER_BASE_URL, // Using `backend` per the docker network name
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: 'dist-web',
      sourcemap: true,
    },
  };
});
