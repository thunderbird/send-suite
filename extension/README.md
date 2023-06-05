## tl;dr

- To work on the TB Extension: `pnpm run build`
  - Note: must be run every time you need to rebuild. Watch mode isn't possible because of the hybrid nature of the pages/extension.
- To use the UI test page: `pnpm run dev`

## Details

This extension is built using `vite` configured for:

- "regular pages" - there are multiple entry points, i.e., `index.*.html`
- [library mode](https://vitejs.dev/guide/build.html#library-mode) - the extension needs a single file that attaches listeners

The `build` command runs `build.sh`, which does the following:

- manually clears/creates the `dist/` directory
- builds the library (`src/background.js`), targeting `dist/background`
- builds the pages, targeting `dist/pages`
- moves the contents of both targets to `dist/`

In the process, it also copies over the contents of `public/` (including the `manifest.json`, `popup.*` and `management.*` files).
