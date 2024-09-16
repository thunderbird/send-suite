# Lockbox/Send

## Prerequisites

You'll need the following to run the server and use the client:

- An account on the FXA staging server
- The client id and secret for the FXA staging server (in 1Password, in the Services vault)

## Webapp

### How to set up and run webapp

First, clone the repo and create/edit `backend/.env`:

```sh
git clone git@github.com:thunderbird/send-suite.git
cd send-suite
cd backend

cp .env.sample .env
# edit .env, supplying values for the FXA_CLIENT_ID and FXA_CLIENT_SECRET vars

cd ..
# back out to the main directory before proceeding
```

Next, create the `frontend/.env`:

```sh
cd frontend

cp .env.sample .env
# for now, you shouldn't need to edit the .env

cd ..
# back out to the main directory before proceeding
```

Finally, install the dependencies

```sh
pnpm install
```

To run the full stack:

```sh
pnpm dev
```

### Troubleshooting

If you're having any issues with docker (ex: no memory left, or volumes do not contain expected files), prune docker and rebuild containers from scratch:

```sh
docker system prune
docker-compose build --no-cache
```

Then `docker compose up -d` should work

When you're done with the project, you can run:

```sh
docker compose down
```

This stops containers and removes containers, networks, volumes, and images created by `dev`.

Note: All named volumes are persisted. You can see these expressed as `volumes` on the `compose.yml` file.

### Using the webapp

- Visit `https://localhost:8088/` and accept the self-signed certificate
  - In Firefox, you'll want to add an exception for this certificate
- Then, you can open `http://localhost:5173/lockbox/`
- Click the `Profile` link in the sidebar and click `Log into Moz Acct`
- After logging in, go to `My Files` in the sidebar

From here, you can do things like create folders, upload files to folders, and create share links. (Note that the share links will only be valid on your machines, since they'll have `localhost` addresses.)

## TB Extension

### Building the TB Extension

If this is the first time you're building the extension, you'll need to install the tooling on the host:

```sh
cd frontend
pnpm/yarn/npm install
```

Build the extension:

```sh
pnpm/yarn/npm run build
```

This outputs to `frontend/dist/`.

### Loading the TB Extension

Make sure you add your localhost certificate. We have an
[In depth guide](https://github.com/thunderbird/send-suite/issues/190).

To load this in Thunderbird:

- Go to Settings and click `Add-ons and Themes` in the lower left-hand corner
- In the "Manage your Extensions" window, click the gear icon in the upper right and choose `Debug Add-ons`
- On the "Mozilla Thunderbird" page that appears, click the `Load Temporary Add-on...` button in the upper-right.
- Navigate to the `send-suite/frontend/dist/` directory and choose the `manifest.json`

### Using the Extension

- After loading the extension, go to Settings and click `Composition` in the left-hand menu.
- Scroll down to "Attachments" and click the `Add Lockbox Send` button
- In the Lockbox Send configuration panel, click the `Log into Mozilla Account` button
- In the popup, follow the Mozilla Account login flow
- After you successfully log in, the popup should close (or you can manually close it)
- **IMPORTANT**: in the Lockbox Send configuration panel, click the `Click after moz login` button to finish setting up the extension with the Mozilla Account.

You can now right-click attachments in emails and choose "Convert to Lockbox Send". You'll be prompted for an optional password to protect the attachment.

Successful conversion results in a "beautiful" link being added to your message body.

Note: the link will only work on your local machine, as the URL is a `localhost` one. (But you should be able to open it in a browser and see that the file downloads and can be viewed).

#### Re-login will/may be required

The TB Extension loses the login session pretty quickly, requiring you to go click the `Log into Mozilla Account` button again.

This could be because the sessions are expiring when the backend reloads (which it does automatically when code changes).

If you're not changing the backend code (and the backend doesn't restart), you might be fine.

## Building

To build the frontend run from the root `pnpm build:frontend`
This will produce the static assets for deployment. It will generate the following directories:

Web app: `frontend/dist`

TB extension: `frontend/dist-extension`

To test the web client locally, you can run
`cd frontend`
and `pnpm preview`
This will create a server on `http://localhost:4173/`

## Additional documentation

See the `docs/` folder for a draft of the detailed documentation.

[Here](https://typicode.github.io/husky/how-to.html#testing-hooks-without-committing) you can read more.

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

## Sentry

Make sure you ask the team for `VITE_SENTRY_AUTH_TOKEN`

## Debugging

### Backend

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

2. Add this to your `backend/.env` file:

```
DEBUG=true
```

3. Run `pnpm dev`

4. Run your debug session. If you have multiple configs, make sure you run the one called `Docker: Attach to Node`

### Frontend

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
      "url": "http://localhost:5173/lockbox",
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

1. Run `pnpm dev`
2. Run `pnpm test:e2e`

This will open the test suite in headed mode so you can log into your moz account.

After you successfully logged in. Make sure you click `My Files` on the sidebar to finish saving your state. This should close the test window.

Afterwards you'll see a new file inside the `data` folder. It should be called `lockbox` + `timestamp`.json`

3. Copy the contents of this new file into `data/lockboxstate.json`. Don't worry, this file or the other data files are git ignored.

4) Run the tests again and see it fly!

**Important note**: You probably have to log back in after a day or so. That's just how the app works. Make sure you copy the new data to the `data/lockboxstate.json` file so you don't have to manually log in again on every run.
