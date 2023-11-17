# Thunderbird Send Suite

A set of mini-applications that extend the functionality of Thunderbird:

- Send: email attachments using the CloudFile API
- Lockbox: file storage and sharing
- Messages: easy to use private chat (between individuals or groups)

All of these services are end-to-end encrypted.

## Tooling

- Node.js (v20 was used for development, though an earlier LTS should work)
- `npm` (examples will use `pnpm`, but `npm` or `yarn` should be fine)
- `docker` with the `compose` plugin

## Quick start

### Create a `.env` file from the `dev.env`

```
cp backend/dev.env backend/env

```

### Start the backend

```
cd backend
docker compose up
```

### Let your browser use the self-signed TLS certificate

- visit `https://localhost:8088` in your browser
- allow your browser to go to the page, despite the certificate being self-signed
- you should see a page with the word "echo"

### Start the frontend

```sh
cd frontend
docker compose up
```

### Open the Lockbox UI in the browser

Visit `http://localhost:5173/lockbox/`

### Set up your encryption keys and user

- Click `Show debug panel` at the top-center of the page
- Click the "Gen Keypair" button
- Click the "Store Keys" button
- Enter an/any email address in the Email field
- Click the "Log in" button
- Click the "Store User" button
- Click "Hide debug panel"

### Use the app!

You can now:

- create folders
- upload files
- share folders with other users
- generate share links to send to other users or anonymous users
