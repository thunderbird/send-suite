// vite.config.js
import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    // resolve: {
    //   alias: {
    //     "@": resolve(__dirname, "./src"),
    //   },
    // },
    // minify: false,
    outDir: "dist/pages",
    rollupOptions: {
      input: {
        // background: resolve(__dirname, "src/background.js"),
        "extension-ui": resolve(__dirname, "index.extension-ui.html"),
        "extension-settings": resolve(
          __dirname,
          "index.extension-settings.html"
        ),
        // testpage: resolve(__dirname, "index.test.html"),
        // management: resolve(__dirname, "index.management.html"),
        // stats: resolve(__dirname, 'index.stats.html'),
        // options: resolve(__dirname, 'index.options.html'),
        // popup: resolve(__dirname, 'index.popup.html'),
      },
    },
  },
});
