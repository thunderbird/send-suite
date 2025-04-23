# Thunderbird Send

[![codecov](https://codecov.io/gh/thunderbird/send-suite/branch/main/graph/badge.svg)](https://codecov.io/gh/thunderbird/send-suite)

Thunderbird Send is an end-to-end encrypted file sharing solution, allowing you to safely encrypt, password-protect and send files through our [website](https://send.tb.pro/) or as an [add-on](https://addons.thunderbird.net/en-US/thunderbird/addon/tb_send/?src=search) for your Thunderbird Desktop application.

Currently, we are in a closed alpha state. Meanwhile, please join our [waitlist](https://tb.pro/) to try it out during our beta period, or feel free to follow the guide below to run a local or self-hosted version for yourself!

## Getting started

We have a detailed getting started guide in [our wiki](https://github.com/thunderbird/send-suite/wiki)

## Prerequisites

Make sure you install [docker](https://www.docker.com/get-started/) for local development.

If you're developing changes to the our account workflow, you'll need the following to run the server and use the client:

- An account on the FXA staging server
- The client id and secret for the FXA staging server (in 1Password, in the Services vault)

## Setting up the apps

Clone this repo

```sh
git clone git@github.com:thunderbird/send-suite.git
cd send-suite
```

and install the package managers we use

```sh
npm install -g bun
npm install -g pnpm
```

Or alternatively

```sh
curl -fsSL https://bun.sh/install | bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

Finally, install the dependencies (this command will install both frontend and backend)

```sh
pnpm install
```

### Creating your environment

You can run the setup automatically with

```sh
lerna run setup:local --scope=send-suite
```

Or, if you wish to run this against staging FXA (requires client id and secret) do the following:

```sh
lerna run setup --scope=send-suite
```

Then edit the `packages/send/backend/.env` file to supply values for the FXA_CLIENT_ID and FXA_CLIENT_SECRET vars

Finally, run the full stack (you can use this command anytime you want to run the application back again):

```sh
lerna run dev --scope=send-suite
```

Congrats! Now you should be able to see the app on `http://localhost:5173/` and the backend running on `https://localhost:8088/`

In order to login, you must create a new account. Click the "Or register" link and follow the prompts to create an account, which will then log you in to your local instance of Send.

### Using the webapp

- Visit `https://localhost:8088/` and accept the self-signed certificate
  - In Firefox, you'll want to add an exception for this certificate
- Then, you can open `http://localhost:5173/`
- Click the `Profile` link in the sidebar and click `Log into Moz Acct`
- After logging in, go to `My Files` in the sidebar

From here, you can do things like create folders, upload files to folders, and create share links. (Note that the share links will only be valid on your machines, since they'll have `localhost` addresses.)

## TB Extension

### Building the TB Extension for development

If this is the first time you're building the extension, you'll need to install the tooling on the host:

```sh
# Install frontend dependencies
pnpm i --filter send-frontend
```

Build the extension:

```sh
lerna run build:dev --scope=send-frontend
```

This outputs an xpi file at `packages/send`, you should see something like `send-suite-0.1.22.xpi`.

### Loading the TB Extension

Make sure you add your localhost certificate. We have an
[In depth guide](https://github.com/thunderbird/send-suite/issues/190).

To load this in Thunderbird:

- Go to Settings and click `Add-ons and Themes` in the lower left-hand corner
- In the "Manage your Extensions" window, click the gear icon in the upper right and choose `Debug Add-ons`
- On the "Mozilla Thunderbird" page that appears, click the `Load Temporary Add-on...` button in the upper-right.
- Navigate to the root directory and choose the xpi you generated earlier.

### Using the Extension

- After loading the extension, go to Settings and click `Composition` in the left-hand menu.
- Scroll down to "Attachments" and click the `Add Thunderbird Send` button
- In the Thunderbird Send configuration panel, click the `Log into Mozilla Account` button
- In the popup, follow the Mozilla Account login flow
- After you successfully log in, the popup should close (or you can manually close it)

You can now right-click attachments in emails and choose "Convert to Thunderbird Send". You'll be prompted for an optional password to protect the attachment.

Successful conversion results in a "beautiful" link being added to your message body.

Note: the link will only work on your local machine, as the URL is a `localhost` one. (But you should be able to open it in a browser and see that the file downloads and can be viewed).

### Submitting .xpi to ATN

Make sure you have a file named `.env.production` inside the frontend directory that contains the environment variables for production. Otherwise this will fail.

Run

```sh
lerna run build-and-submit --scope=send-frontend
```

This will create `frontend-source.zip` use it to upload to ATN when asked for source code.
It will also move your `.xpi` to the `packages/send` directory.

## Pre-commit hooks

We use `lint-staged` + `husky` to run prettier and eslint on staged files.

The shell script lives on [.husky/pre-commit](./.husky/pre-commit)

### Testing hooks

Add this line to the end of [.husky/pre-commit](./.husky/pre-commit)

`exit 1`

Make sure you commit a file you want to run `lint-staged` on

Run this command:

```
git commit -m "testing pre-commit code"
# A commit will not be created
```

You should see the output of the hook as if you actually commited your files.

### Skipping hooks

If for some reason you're confident on a change and would like to skip pre-commit hooks. Add `--no-verify` at the end of your commit command.

### More about hooks

See the `docs/` folder for a draft of the detailed documentation.

[Here](https://typicode.github.io/husky/how-to.html#testing-hooks-without-committing) you can read more.

### Authentication

We're using jwt tokens to authenticate users. Once they go through the login flow, they get a jwt token that is stored as a secure cookie. This is passed on every request to the backend automatically. We use this token to know who is making the request and by decoding it we get user data such as userId and email. We can set how many days the token is valid for and once it expires, the user has to log in again.

### Public login

(without FXA)

If you want to use the application without an FXA account, you can set these environment variables.

`packages/send/backend/.env` to `ALLOW_PUBLIC_LOGIN=true`

`packages/send/frontend/.env` to `VITE_ALLOW_PUBLIC_LOGIN=true`

## Sentry

Make sure you ask the team for `VITE_SENTRY_AUTH_TOKEN`

## Debugging

### VSCode debugger for the backend

You can use VSCode's debugger for the backend.

1. Add this to your `.vscode/launch.json`

```
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "localRoot": "${workspaceFolder}/backend",
      "name": "Docker: Attach to Node",
      "remoteRoot": "/app"
    },
  ]
}

```

3. From the root, run `pnpm dev`

4. Run your debug session. If you have multiple configs, make sure you run the one called `Docker: Attach to Node`

### VSCode debugger for the frontend

1. Run this command `code frontend` to open a session on the frontend package.

2. Add this to your `.vscode/launch.json` file:

```
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173/send",
      "skipFiles": [
        "<node_internals>/**",
        "${workspaceFolder}/node_modules/**/*.js"
      ],
      "enableContentValidation": false,
      "webRoot": "${workspaceFolder}/src",
      "pathMapping": { "url": "/src/", "path": "${webRoot}/" }
    }
  ]
}

```

3. Start a new debugging session. This will open a new chrome window that is connected to your VSCode session. Now you can add breakpoints and do all sorts of magic.

## Testing

### E2E testing

### Setting up

1. In order for the tests to run locally, you have to set up your `.env` files to match the default. This will overwrite your `.env` files. If you need to back up your keys before that you can run.

```sh
cd packages/send
cd frontend
cp .env .env.backup
cd ../backend
cp .env .env.backup
```

2. Set your environment variables by running `lerna run setup:local`

3. Make sure you install playwright's dependencies by running:

```sh
pnpm --filter=send-suite exec playwright install
```

#### UI mode

You can run the test suite on UI Mode. UI Mode lets you explore, run, and debug tests with a time travel experience complete with a watch mode. All test files are displayed in the testing sidebar, allowing you to expand each file and describe block to individually run, view, watch, and debug each test.

1. Run `lerna run dev:detach --scope=send-suite`
2. Run `lerna run test:e2e:ui --scope=send-suite`

### Headless mode

If you want to run the tests just as they run on CI (headless mode), do the following.

```sh
lerna run dev:detach --scope=send-suite
lerna run test:e2e:ci --scope=send-suite
```

#### CI mode

Our CI/CD pipeline runs the test suite on headless mode. To reproduce this locally run `pnpm test:e2e:ci`

## Releasing

In order to keep track of our releases, we need to set our versions on either the `frontend` or `backend` package.json. To bump the version, move to the directory and run `pnpm version patch` (you can use minor or major depending on your needs). This will bump the version number on package.json and the related files that need updating. The backend requires `config.stage.yaml` to match the version number, whereas the frontend requires `manifest.json` to match. This is done automatically as long as you handle the version via `pnpm version`

## Storage

We're using Backblaze for our storage buckets.

We're uploading/downloading directly to the bucket using signed urls. In order for us to avoid CORS issues, we have to configure the buckets correctly.

Using the `b2` CLI, run the authorization command:

`b2 account authorize`

This will prompt for your credentials. Make sure you use the master key and not a specific bucket key as it won't work.

To confirm that it worked, list the buckets from the account.
`b2 ls`

Move to the b2 rules directory
`cd packages/send/backend/b2`

Update the rules
`b2 bucket update {YOUR_BUCKET_NAME} --cors-rules "$(<./rules.json)"`

Updating retention rules
`b2 bucket update {YOUR_BUCKET_NAME} --lifecycle-rule "$(<./retention.json)"`

### Troubleshooting Send

Sometimes npm packages get screwed you come back to the project after a while. You can have a clean run by running.

```sh
lerna clean
cd packages/send
docker compose down
docker system prune -a --volumes
pnpm i
pnpm dev
```

If you're having any issues with docker (ex: no memory left, or volumes do not contain expected files), prune docker and rebuild containers from scratch:

```sh
cd packages/send
docker compose down
docker system prune -a --volumes
docker-compose build --no-cache
```

Then run

```sh
# from packages/send
docker compose up -d
```

Everything should run well now

When you're done with the project, you can run:

```sh
# from packages/send
docker compose down
```

This stops containers and removes containers, networks, volumes, and images created by `dev`.

Note: All named volumes are persisted. You can see these expressed as `volumes` on the `compose.yml` file.

## Monorepo

## Project management

Each project inside the `packages` folder, contains a `package.json` where the `name` is used as the reference for command execution (we'll call this the package name). Each package is declared inside the `pnpm-workspace.yaml` and `lerna.json` files.

## Install all dependencies

If you run `pnpm install` from the root. This command will install **all the dependencies** for all the packages inside the workspace.

## Install partial dependencies

If you want to install only the dependencies for the projects you need, you can run the filter command and pass a glob pattern matching the ones you want. For example. If you want to install all dependencies for `send`, you can run

`pnpm install --filter "send-*"`

This will only install the dependencies where the package name starts with `send-`.

## Running commands

_Note: Make sure you install the dependencies you need before running your commands._

You can run any package's commands by calling.

`lerna run <your-command> --scope=<package-name>`

For example, If I want to run e2e tests on send, I can run

`lerna run test:e2e:ci --scope=send-suite`
