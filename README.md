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

cp dev.env .env
# edit .env, supplying values for the FXA_CLIENT_ID and FXA_CLIENT_SECRET vars

cd ..
# back out to the main directory before proceeding
```

Next, create the `frontend/.env`:

```sh
cd frontend

cp dev.env .env
# for now, you shouldn't need to edit the .env

cd ..
# back out to the main directory before proceeding
```

To run the containers:

```sh
docker compose up -d
```

To watch the backend logs:

```sh
docker compose logs -f
```

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

2. Add this to your top level `.env` file:

```
MODE=debug
```

3. Run `pnpm dev`

4. Run your debug session. If you have multiple configs, make sure you run the one called `Docker: Attach to Node`
