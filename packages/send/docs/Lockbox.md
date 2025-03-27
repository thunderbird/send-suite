# Setup

Lockbox is a web application and Thunderbird extension built with Node.js and Vue.js.

It provides end-to-end encrypted cloud file management and sharing. Lockbox integrates with Thunderbird, letting the user manage and share files from the embedded Lockbox UI. In addition, the extension facilitates encrypted attachments via the CloudFile API.

To develop locally, clone the repository and install the front-end dependencies.

```sh
git clone git@github.com:thundernest/send-suite.git
cd frontend
pnpm install
```

In the future, the front-end will be run from a Docker container, making it unnecessary to install any dependencies.

# Running the web application

You'll want to run the front-end and backend in separate terminal tabs/windows.

The backend runs via docker, using a `compose.yml` file.
The front-end uses an npm script.

## Backend

Runs on the following ports:

- 8088 (https)
- 8080 (http)

```sh
cd backend
docker compose up
```

The plain `http` version is useful for calling the API directly, but the front-end expects to use `https`.

### ⚠️ Allow connections to `https://localhost:8088` in your browser. ⚠️

The front-end won't be able to make any requests to the backend unless you allow the self-signed certificate.

## Front-end

Runs on port 5173

```sh
cd frontend
pnpm run dev
```

Then go to [http://localhost:5173](http://localhost:5173)

# Building the extension

```sh
cd frontend
pnpm run build
```

## Watch and build

Use [entr](https://github.com/eradman/entr) for a quick and dirty watcher.

After installing `entr` with your package manager, this command will rebuild the extension whenever you make changes:

```sh
cd frontend
ls **/*.{js,json,vue} | grep -v dist | entr -r 'pnpm run build'
```

# Architecture Overview (coming soon)

With detailed docs for:

- Vue (wrapper, core, pages, views, components, elements)
  - also: classes, managers, common, lib
- End-to-End Encryption
- Sharing (user-to-user, user-to-anonymous)

# Misc database things

Note: You'll want to `docker compose exec app bash` before performing any of these operations.

## How to reset the database

```sh
npm run db:reset
```

## How to update the database

```sh
npm run db:migrate
```

It will prompt you for a migration name. (We don't yet have a convention, so feel free to make up a name.)

```sh
npm run db:generate
```

This command updates the typescript types created by the Prisma ORM.
If you're editing any of the backend code with VS Code, you should run `Developer: Reload Window` from the Command Palette.

## How to browse the database

Start the Prisma Studio with

```sh
npm run db:browse
```

Then visit `http://localhost:5555` in your browser.
