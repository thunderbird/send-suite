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
    outDir: "dist/pages",
    rollupOptions: {
      input: {
        // background: resolve(__dirname, "src/background.js"),
        testpage: resolve(__dirname, "index.test.html"),
        // stats: resolve(__dirname, 'index.stats.html'),
        // options: resolve(__dirname, 'index.options.html'),
        // popup: resolve(__dirname, 'index.popup.html'),
      },
    },
  },
});
