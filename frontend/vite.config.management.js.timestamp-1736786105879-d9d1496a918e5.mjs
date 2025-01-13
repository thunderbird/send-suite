// vite.config.management.js
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

// vite.config.management.js
var __vite_injected_original_dirname2 = "/Users/alejandro/WebApps/send-suite/frontend";
var vite_config_management_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
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
          version: packageJson.version,
          appHost: "management"
        }
      })
    ],
    test: {
      include: ["**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      globals: true
    },
    resolve: {
      alias: {
        "@": path2.resolve(__vite_injected_original_dirname2, "src")
      }
    },
    build: {
      outDir: "dist/pages",
      sourcemap: true,
      minify: true,
      rollupOptions: {
        input: {
          management: path2.resolve(__vite_injected_original_dirname2, "index.management.html")
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "chunks/[name].js",
          assetFileNames: "assets/[name].[ext]"
        }
      }
    }
  };
});
export {
  vite_config_management_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWFuYWdlbWVudC5qcyIsICJzaGFyZWRWaXRlQ29uZmlnLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2FsZWphbmRyby9XZWJBcHBzL3NlbmQtc3VpdGUvZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9hbGVqYW5kcm8vV2ViQXBwcy9zZW5kLXN1aXRlL2Zyb250ZW5kL3ZpdGUuY29uZmlnLm1hbmFnZW1lbnQuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2FsZWphbmRyby9XZWJBcHBzL3NlbmQtc3VpdGUvZnJvbnRlbmQvdml0ZS5jb25maWcubWFuYWdlbWVudC5qc1wiO2ltcG9ydCB7IHNlbnRyeVZpdGVQbHVnaW4gfSBmcm9tICdAc2VudHJ5L3ZpdGUtcGx1Z2luJztcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgeyBwYWNrYWdlSnNvbiwgc2hhcmVkVml0ZUNvbmZpZyB9IGZyb20gJy4vc2hhcmVkVml0ZUNvbmZpZyc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSk7XG4gIHJldHVybiB7XG4gICAgLi4uc2hhcmVkVml0ZUNvbmZpZyxcbiAgICBwbHVnaW5zOiBbXG4gICAgICB2dWUoKSxcbiAgICAgIHNlbnRyeVZpdGVQbHVnaW4oe1xuICAgICAgICBvcmc6ICd0aHVuZGVyYmlyZCcsXG4gICAgICAgIHByb2plY3Q6ICdzZW5kLXN1aXRlLWZyb250ZW5kJyxcbiAgICAgICAgYXV0aFRva2VuOiBlbnYuVklURV9TRU5UUllfQVVUSF9UT0tFTixcbiAgICAgICAgcmVsZWFzZTogcGFja2FnZUpzb24udmVyc2lvbixcbiAgICAgICAgbW9kdWxlTWV0YWRhdGE6IHtcbiAgICAgICAgICB2ZXJzaW9uOiBwYWNrYWdlSnNvbi52ZXJzaW9uLFxuICAgICAgICAgIGFwcEhvc3Q6ICdtYW5hZ2VtZW50JyxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgIF0sXG4gICAgdGVzdDoge1xuICAgICAgaW5jbHVkZTogWycqKi8qLnRlc3Que2pzLG1qcyxjanMsdHMsbXRzLGN0cyxqc3gsdHN4fSddLFxuICAgICAgZ2xvYmFsczogdHJ1ZSxcbiAgICB9LFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICBvdXREaXI6ICdkaXN0L3BhZ2VzJyxcbiAgICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgaW5wdXQ6IHtcbiAgICAgICAgICBtYW5hZ2VtZW50OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnaW5kZXgubWFuYWdlbWVudC5odG1sJyksXG4gICAgICAgIH0sXG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnW25hbWVdLmpzJyxcbiAgICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2NodW5rcy9bbmFtZV0uanMnLFxuICAgICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS5bZXh0XScsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH07XG59KTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2FsZWphbmRyby9XZWJBcHBzL3NlbmQtc3VpdGUvZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9hbGVqYW5kcm8vV2ViQXBwcy9zZW5kLXN1aXRlL2Zyb250ZW5kL3NoYXJlZFZpdGVDb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2FsZWphbmRyby9XZWJBcHBzL3NlbmQtc3VpdGUvZnJvbnRlbmQvc2hhcmVkVml0ZUNvbmZpZy50c1wiO2ltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IFVzZXJDb25maWcgfSBmcm9tICd2aXRlJztcblxuZXhwb3J0IGNvbnN0IHBhY2thZ2VKc29uID0gSlNPTi5wYXJzZShcbiAgZnMucmVhZEZpbGVTeW5jKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3BhY2thZ2UuanNvbicpLCAndXRmOCcpXG4pO1xuXG5jb25zb2xlLmxvZygndXNpbmcgcGFja2FnZUpzb246JywgcGFja2FnZUpzb24pO1xuXG5leHBvcnQgY29uc3Qgc2hhcmVkVml0ZUNvbmZpZzogVXNlckNvbmZpZyA9IHtcbiAgZGVmaW5lOiB7XG4gICAgX19BUFBfVkVSU0lPTl9fOiBKU09OLnN0cmluZ2lmeShwYWNrYWdlSnNvbi52ZXJzaW9uKSxcbiAgfSxcbn07XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTRVLFNBQVMsd0JBQXdCO0FBQzdXLE9BQU8sU0FBUztBQUNoQixPQUFPQSxXQUFVO0FBQ2pCLFNBQVMsY0FBYyxlQUFlOzs7QUNIMFIsT0FBTyxRQUFRO0FBQy9VLE9BQU8sVUFBVTtBQURqQixJQUFNLG1DQUFtQztBQUlsQyxJQUFNLGNBQWMsS0FBSztBQUFBLEVBQzlCLEdBQUcsYUFBYSxLQUFLLFFBQVEsa0NBQVcsZ0JBQWdCLEdBQUcsTUFBTTtBQUNuRTtBQUVBLFFBQVEsSUFBSSxzQkFBc0IsV0FBVztBQUV0QyxJQUFNLG1CQUErQjtBQUFBLEVBQzFDLFFBQVE7QUFBQSxJQUNOLGlCQUFpQixLQUFLLFVBQVUsWUFBWSxPQUFPO0FBQUEsRUFDckQ7QUFDRjs7O0FEZEEsSUFBTUMsb0NBQW1DO0FBT3pDLElBQU8saUNBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLENBQUM7QUFDdkMsU0FBTztBQUFBLElBQ0wsR0FBRztBQUFBLElBQ0gsU0FBUztBQUFBLE1BQ1AsSUFBSTtBQUFBLE1BQ0osaUJBQWlCO0FBQUEsUUFDZixLQUFLO0FBQUEsUUFDTCxTQUFTO0FBQUEsUUFDVCxXQUFXLElBQUk7QUFBQSxRQUNmLFNBQVMsWUFBWTtBQUFBLFFBQ3JCLGdCQUFnQjtBQUFBLFVBQ2QsU0FBUyxZQUFZO0FBQUEsVUFDckIsU0FBUztBQUFBLFFBQ1g7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFDQSxNQUFNO0FBQUEsTUFDSixTQUFTLENBQUMsMkNBQTJDO0FBQUEsTUFDckQsU0FBUztBQUFBLElBQ1g7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUtDLE1BQUssUUFBUUMsbUNBQVcsS0FBSztBQUFBLE1BQ3BDO0FBQUEsSUFDRjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsV0FBVztBQUFBLE1BQ1gsUUFBUTtBQUFBLE1BQ1IsZUFBZTtBQUFBLFFBQ2IsT0FBTztBQUFBLFVBQ0wsWUFBWUQsTUFBSyxRQUFRQyxtQ0FBVyx1QkFBdUI7QUFBQSxRQUM3RDtBQUFBLFFBQ0EsUUFBUTtBQUFBLFVBQ04sZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsUUFDbEI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogWyJwYXRoIiwgIl9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lIiwgInBhdGgiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUiXQp9Cg==
