// vite.config.js
import { sentryVitePlugin } from "file:///Users/alejandro/WebApps/send-suite/frontend/node_modules/.pnpm/@sentry+vite-plugin@2.22.7/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
import vue from "file:///Users/alejandro/WebApps/send-suite/frontend/node_modules/.pnpm/@vitejs+plugin-vue@4.6.2_vite@5.4.11_@types+node@22.10.2__vue@3.5.13_typescript@5.7.2_/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path2 from "path";
import { defineConfig, loadEnv } from "file:///Users/alejandro/WebApps/send-suite/frontend/node_modules/.pnpm/vite@5.4.11_@types+node@22.10.2/node_modules/vite/dist/node/index.js";

// sharedViteConfig.ts
import fs from "fs";
import path from "path";
var __vite_injected_original_dirname = "/Users/alejandro/WebApps/send-suite/frontend";
var packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__vite_injected_original_dirname, "./package.json"), "utf8")
);
console.log("using packageJson:", packageJson);
var sharedViteConfig = {
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version)
  }
};

// vite.config.js
var __vite_injected_original_dirname2 = "/Users/alejandro/WebApps/send-suite/frontend";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const SERVER_BASE_URLS = {
    // backend is the docker network name by default
    development: "http://backend:8080",
    production: "https://lockbox.thunderbird.dev"
  };
  const SERVER_BASE_URL = SERVER_BASE_URLS[mode];
  console.log("env:", env);
  console.log("Environment:", mode);
  console.log("Server Base URL:", SERVER_BASE_URL);
  return {
    ...sharedViteConfig,
    plugins: [
      vue(),
      sentryVitePlugin({
        org: "thunderbird",
        project: "send-suite-frontend",
        authToken: env.VITE_SENTRY_AUTH_TOKEN,
        release: packageJson.version,
        moduleMetadata: {
          version: packageJson.version
        }
      })
    ],
    server: {
      // `https: true` gives `Error code: SSL_ERROR_NO_CYPHER_OVERLAP`
      // https: true,
      proxy: {
        // `secure: false` seems to do nothing
        // secure: false,
        "/lockbox/fxa": SERVER_BASE_URL,
        // Using `backend` per the docker network name
        "/login-success.html": SERVER_BASE_URL,
        // Using `backend` per the docker network name
        "/login-failed.html": SERVER_BASE_URL
        // Using `backend` per the docker network name
      }
    },
    resolve: {
      alias: {
        "@": path2.resolve(__vite_injected_original_dirname2, "src")
      }
    },
    build: {
      outDir: "dist-web",
      sourcemap: true
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAic2hhcmVkVml0ZUNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9hbGVqYW5kcm8vV2ViQXBwcy9zZW5kLXN1aXRlL2Zyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvYWxlamFuZHJvL1dlYkFwcHMvc2VuZC1zdWl0ZS9mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvYWxlamFuZHJvL1dlYkFwcHMvc2VuZC1zdWl0ZS9mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IHNlbnRyeVZpdGVQbHVnaW4gfSBmcm9tICdAc2VudHJ5L3ZpdGUtcGx1Z2luJztcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgeyBwYWNrYWdlSnNvbiwgc2hhcmVkVml0ZUNvbmZpZyB9IGZyb20gJy4vc2hhcmVkVml0ZUNvbmZpZyc7XG5cblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpKTtcblxuICBjb25zdCBTRVJWRVJfQkFTRV9VUkxTID0ge1xuICAgIC8vIGJhY2tlbmQgaXMgdGhlIGRvY2tlciBuZXR3b3JrIG5hbWUgYnkgZGVmYXVsdFxuICAgIGRldmVsb3BtZW50OiAnaHR0cDovL2JhY2tlbmQ6ODA4MCcsXG4gICAgcHJvZHVjdGlvbjogJ2h0dHBzOi8vbG9ja2JveC50aHVuZGVyYmlyZC5kZXYnLFxuICB9O1xuXG4gIGNvbnN0IFNFUlZFUl9CQVNFX1VSTCA9IFNFUlZFUl9CQVNFX1VSTFNbbW9kZV07XG5cbiAgY29uc29sZS5sb2coJ2VudjonLCBlbnYpO1xuICBjb25zb2xlLmxvZygnRW52aXJvbm1lbnQ6JywgbW9kZSk7XG4gIGNvbnNvbGUubG9nKCdTZXJ2ZXIgQmFzZSBVUkw6JywgU0VSVkVSX0JBU0VfVVJMKTtcblxuICByZXR1cm4ge1xuICAgIC4uLnNoYXJlZFZpdGVDb25maWcsXG4gICAgcGx1Z2luczogW1xuICAgICAgdnVlKCksXG4gICAgICBzZW50cnlWaXRlUGx1Z2luKHtcbiAgICAgICAgb3JnOiAndGh1bmRlcmJpcmQnLFxuICAgICAgICBwcm9qZWN0OiAnc2VuZC1zdWl0ZS1mcm9udGVuZCcsXG4gICAgICAgIGF1dGhUb2tlbjogZW52LlZJVEVfU0VOVFJZX0FVVEhfVE9LRU4sXG4gICAgICAgIHJlbGVhc2U6IHBhY2thZ2VKc29uLnZlcnNpb24sXG4gICAgICAgIG1vZHVsZU1ldGFkYXRhOiB7XG4gICAgICAgICAgdmVyc2lvbjogcGFja2FnZUpzb24udmVyc2lvbixcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgIF0sXG4gICAgc2VydmVyOiB7XG4gICAgICAvLyBgaHR0cHM6IHRydWVgIGdpdmVzIGBFcnJvciBjb2RlOiBTU0xfRVJST1JfTk9fQ1lQSEVSX09WRVJMQVBgXG4gICAgICAvLyBodHRwczogdHJ1ZSxcbiAgICAgIHByb3h5OiB7XG4gICAgICAgIC8vIGBzZWN1cmU6IGZhbHNlYCBzZWVtcyB0byBkbyBub3RoaW5nXG4gICAgICAgIC8vIHNlY3VyZTogZmFsc2UsXG4gICAgICAgICcvbG9ja2JveC9meGEnOiBTRVJWRVJfQkFTRV9VUkwsIC8vIFVzaW5nIGBiYWNrZW5kYCBwZXIgdGhlIGRvY2tlciBuZXR3b3JrIG5hbWVcbiAgICAgICAgJy9sb2dpbi1zdWNjZXNzLmh0bWwnOiBTRVJWRVJfQkFTRV9VUkwsIC8vIFVzaW5nIGBiYWNrZW5kYCBwZXIgdGhlIGRvY2tlciBuZXR3b3JrIG5hbWVcbiAgICAgICAgJy9sb2dpbi1mYWlsZWQuaHRtbCc6IFNFUlZFUl9CQVNFX1VSTCwgLy8gVXNpbmcgYGJhY2tlbmRgIHBlciB0aGUgZG9ja2VyIG5ldHdvcmsgbmFtZVxuICAgICAgfSxcbiAgICB9LFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICBvdXREaXI6ICdkaXN0LXdlYicsXG4gICAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgfSxcbiAgfTtcbn0pO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYWxlamFuZHJvL1dlYkFwcHMvc2VuZC1zdWl0ZS9mcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2FsZWphbmRyby9XZWJBcHBzL3NlbmQtc3VpdGUvZnJvbnRlbmQvc2hhcmVkVml0ZUNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvYWxlamFuZHJvL1dlYkFwcHMvc2VuZC1zdWl0ZS9mcm9udGVuZC9zaGFyZWRWaXRlQ29uZmlnLnRzXCI7aW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgVXNlckNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuXG5leHBvcnQgY29uc3QgcGFja2FnZUpzb24gPSBKU09OLnBhcnNlKFxuICBmcy5yZWFkRmlsZVN5bmMocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vcGFja2FnZS5qc29uJyksICd1dGY4Jylcbik7XG5cbmNvbnNvbGUubG9nKCd1c2luZyBwYWNrYWdlSnNvbjonLCBwYWNrYWdlSnNvbik7XG5cbmV4cG9ydCBjb25zdCBzaGFyZWRWaXRlQ29uZmlnOiBVc2VyQ29uZmlnID0ge1xuICBkZWZpbmU6IHtcbiAgICBfX0FQUF9WRVJTSU9OX186IEpTT04uc3RyaW5naWZ5KHBhY2thZ2VKc29uLnZlcnNpb24pLFxuICB9LFxufTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBc1QsU0FBUyx3QkFBd0I7QUFDdlYsT0FBTyxTQUFTO0FBQ2hCLE9BQU9BLFdBQVU7QUFDakIsU0FBUyxjQUFjLGVBQWU7OztBQ0gwUixPQUFPLFFBQVE7QUFDL1UsT0FBTyxVQUFVO0FBRGpCLElBQU0sbUNBQW1DO0FBSWxDLElBQU0sY0FBYyxLQUFLO0FBQUEsRUFDOUIsR0FBRyxhQUFhLEtBQUssUUFBUSxrQ0FBVyxnQkFBZ0IsR0FBRyxNQUFNO0FBQ25FO0FBRUEsUUFBUSxJQUFJLHNCQUFzQixXQUFXO0FBRXRDLElBQU0sbUJBQStCO0FBQUEsRUFDMUMsUUFBUTtBQUFBLElBQ04saUJBQWlCLEtBQUssVUFBVSxZQUFZLE9BQU87QUFBQSxFQUNyRDtBQUNGOzs7QURkQSxJQUFNQyxvQ0FBbUM7QUFRekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksQ0FBQztBQUV2QyxRQUFNLG1CQUFtQjtBQUFBO0FBQUEsSUFFdkIsYUFBYTtBQUFBLElBQ2IsWUFBWTtBQUFBLEVBQ2Q7QUFFQSxRQUFNLGtCQUFrQixpQkFBaUIsSUFBSTtBQUU3QyxVQUFRLElBQUksUUFBUSxHQUFHO0FBQ3ZCLFVBQVEsSUFBSSxnQkFBZ0IsSUFBSTtBQUNoQyxVQUFRLElBQUksb0JBQW9CLGVBQWU7QUFFL0MsU0FBTztBQUFBLElBQ0wsR0FBRztBQUFBLElBQ0gsU0FBUztBQUFBLE1BQ1AsSUFBSTtBQUFBLE1BQ0osaUJBQWlCO0FBQUEsUUFDZixLQUFLO0FBQUEsUUFDTCxTQUFTO0FBQUEsUUFDVCxXQUFXLElBQUk7QUFBQSxRQUNmLFNBQVMsWUFBWTtBQUFBLFFBQ3JCLGdCQUFnQjtBQUFBLFVBQ2QsU0FBUyxZQUFZO0FBQUEsUUFDdkI7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFDQSxRQUFRO0FBQUE7QUFBQTtBQUFBLE1BR04sT0FBTztBQUFBO0FBQUE7QUFBQSxRQUdMLGdCQUFnQjtBQUFBO0FBQUEsUUFDaEIsdUJBQXVCO0FBQUE7QUFBQSxRQUN2QixzQkFBc0I7QUFBQTtBQUFBLE1BQ3hCO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBS0MsTUFBSyxRQUFRQyxtQ0FBVyxLQUFLO0FBQUEsTUFDcEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixXQUFXO0FBQUEsSUFDYjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogWyJwYXRoIiwgIl9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lIiwgInBhdGgiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUiXQp9Cg==
