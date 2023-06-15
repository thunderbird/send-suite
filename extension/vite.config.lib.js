// vite.config.js
import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/background.js"),
      name: "LockAndSend",
      fileName: "background",
      formats: ["es"],
    },
    outDir: "dist/background",
    rollupOptions: {
      external: ["vue"],
    },
  },
});
