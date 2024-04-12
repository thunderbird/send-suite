# Lockbox/Send

## Prerequisites

You'll need the following to run the server and use the client:

- An account on the FXA staging server
- The client id and secret for the FXA staging server (in 1Password, in the Services vault)

## How to set up and run

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

To run the containers:

```sh
docker compose up -d
```

To watch the backend logs:

```sh
docker compose logs -f
```

## Using the webapp

- Visit `http://localhost:8080/` and accept the self-signed certificate
  - In Firefox, you'll want to add an exception for this certificate
- Then, you can open `http://localhost:5173/lockbox/`
- Click the `Profile` link in the sidebar and click `Log into Moz Acct`
- After logging in, go to `My Files` in the sidebar

From here, you can do things like create folders, upload files to folders, and create share links. (Note that the share links will only be valid on your machines, since they'll have `localhost` addresses.)

## Additional documentation

See the `docs/` folder for a draft of the detailed documentation.
