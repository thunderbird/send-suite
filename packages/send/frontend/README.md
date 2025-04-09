# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Building the application

Run `pnpm i && pnpm build`

This command will generate a `send-suite-alpha.xpi`, that is the extension file. Additionally, it will generate a `dist` folder with the extension files, a `dist-web` folder with the web files.

## Previewing a production build (web)

Prerequisite: If you have different values you want to use for a production build, it would be a good time to set them on your `frontend/.env`. If you're running a backend locally, that should be running.

To build the frontend run from the root `lerna run build-and-submit --scope=send-frontend`
This will produce the static assets for deployment. It will generate the following directories:

Web app: `frontend/dist-web`

TB extension: `frontend/dist`

To test the web client locally, you can run
`cd frontend`
and `pnpm preview`

This will create a server on `http://localhost:4173/`, you can test your app there.

You might be wondering why not just run the dev environment. Here is a useful [answer that might help](https://stackoverflow.com/questions/71703933/what-is-the-difference-between-vite-and-vite-preview)
