import { Issuer, generators } from 'openid-client';

export function generateState() {
  // State is the random value that we pass to the auth server.
  // They pass it back to us so we can compare to the original.
  return generators.codeChallenge(generators.random());
}

export async function getIssuer() {
  const mozIssuer = await Issuer.discover(process.env.FXA_MOZ_ISSUER);
  return mozIssuer;
}

export function getClient(issuer: Issuer) {
  console.log('evaluating FXA_CLIENT_ID, FXA_CLIENT_SECRET, FXA_REDIRECT_URI', {
    FXA_CLIENT_ID: process.env.FXA_CLIENT_ID,
    FXA_CLIENT_SECRET: process.env.FXA_CLIENT_SECRET,
    FXA_REDIRECT_URI: process.env.FXA_REDIRECT_URI,
  });
  console.log('getting client');
  const client = new issuer.Client({
    client_id: process.env.FXA_CLIENT_ID,
    client_secret: process.env.FXA_CLIENT_SECRET,
    redirect_uris: [process.env.FXA_REDIRECT_URI],
    response_types: ['code'],
    scopes: ['openid', 'profile'],
  });

  return client;
}

export function isEmailInAllowList(email: string, allowList: string[]) {
  // check against @domans
  const domains = allowList.some((entry) => email.endsWith(entry));
  return domains;
}

export async function checkAllowList(email: string | undefined | null) {
  if (!email) {
    throw new Error('checkAllowList requires an email');
  }

  // If an allow list is provided, only allow users in that list
  // If there is no env variable, we allow all users
  if (!process.env.FXA_ALLOW_LIST) {
    return;
  }

  const allowList = process.env.FXA_ALLOW_LIST.replace(/\s/g, '').split(',');
  if (!isEmailInAllowList(email, allowList)) {
    throw new Error('User not in allow list');
  }
}
