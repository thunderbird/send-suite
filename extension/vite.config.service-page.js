// vite.config.js
import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    // minify: false,
    outDir: "dist/service-page",
    rollupOptions: {
      // external: ["vue"],
      input: {
        "service-page": resolve(__dirname, "index.service-page.html"),
      },
    },
  },
});
