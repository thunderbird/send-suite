// vite.config.js
import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/background.js"),
      name: "LockAndSend",
      // the proper extensions will be added
      fileName: "background",
    },
    // resolve: {
    //   alias: {
    //     "@": resolve(__dirname, "./src"),
    //   },
    // },
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "index.test.html"),
        // stats: resolve(__dirname, 'index.stats.html'),
        // options: resolve(__dirname, 'index.options.html'),
      },
    },
    // rollupOptions: {
    //   // make sure to externalize deps that shouldn't be bundled
    //   // into your library
    //   external: ['vue'],
    //   output: {
    //     // Provide global variables to use in the UMD build
    //     // for externalized deps
    //     globals: {
    //       vue: 'Vue',
    //     },
    //   },
    // },
  },
});
