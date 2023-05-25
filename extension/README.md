## tl;dr

- To work on the TB Extension: `pnpm run build:watch`
- To use the UI test page: `pnpm run dev`

## Details

This extension is built using `vite` configured for [library mode](https://vitejs.dev/guide/build.html#library-mode).

This compiles `src/background.js` and its dependencies into `dist/background.js`. It also copies over the contents of `public/` (including the `manifest.json`, `popup.*` and `management.*` files).

If you're working on something fairly low-level functionality (like upload/download), run the vite dev server: `pnpm run dev` and open a browser to http://localhost:5173

Modify `index.html` and `src/main.js` as needed.
