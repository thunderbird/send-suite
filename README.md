# Thunderbird Send

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
pnpm run setup local
```

Or, if you wish to run this against staging FXA (requires client id and secret) do the following:

```sh
pnpm run setup
```

Then edit the `backend/.env` file to supply values for the FXA\_CLIENT\_ID and FXA\_CLIENT\_SECRET vars

Finally, run the full stack:

```sh
pnpm dev
```

Congrats! Now you should be able to see the app on `http://localhost:5173/` and the backend running on `https://localhost:8088/`

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
- Then, you can open `http://localhost:5173/`
- Click the `Profile` link in the sidebar and click `Log into Moz Acct`
- After logging in, go to `My Files` in the sidebar

From here, you can do things like create folders, upload files to folders, and create share links. (Note that the share links will only be valid on your machines, since they'll have `localhost` addresses.)

## TB Extension

### Building the TB Extension for development

If this is the first time you're building the extension, you'll need to install the tooling on the host:

```sh
cd frontend
pnpm/yarn/npm install
```

Build the extension:

```sh
pnpm/yarn/npm run build:dev
```

This outputs an xpi file at the root, you should see something like `send-suite-0.1.22.xpi`.

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

### Authentication

We're using jwt tokens to authenticate users. Once they go through the login flow, they get a jwt token that is stored as a secure cookie. This is passed on every request to the backend automatically. We use this token to know who is making the request and by decoding it we get user data such as userId and email. We can set how many days the token is valid for and once it expires, the user has to log in again.

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

3. From the root, run `pnpm dev`

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

1. Run `pnpm dev`
2. Run `pnpm test:e2e`

This will open the test suite in headed mode so you can log into your moz account.

After you successfully logged in. Make sure you click `My Files` on the sidebar to finish saving your state. This should close the test window.

Afterwards you'll see a new file inside the `data` folder. It should be called `lockbox` + `timestamp`.json`

3. Copy the contents of this new file into `data/lockboxstate.json`. Don't worry, this file or the other data files are git ignored.

4) Run the tests again and see it fly!

**Important note**: You probably have to log back in after a day or so. That's just how the app works. Make sure you copy the new data to the `data/lockboxstate.json` file so you don't have to manually log in again on every run.

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
`cd backend/b2`

Update the rules
`b2 bucket update {YOUR_BUCKET_NAME} --cors-rules "$(<./rules.json)"`

Updating retention rules
`b2 bucket update {YOUR_BUCKET_NAME} --lifecycle-rule "$(<./retention.json)"`
