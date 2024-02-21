import { Issuer, generators } from 'openid-client';

export function generateState() {
  // State is the random value that we pass to the auth server.
  // They pass it back to us so we can compare to the original.
  return generators.codeChallenge(generators.random());
}

export async function getIssuer() {
  const mozIssuer = await Issuer.discover(
    'https://accounts.stage.mozaws.net/.well-known/openid-configuration'
  );
  console.log('Discovered issuer %s %O', mozIssuer.issuer, mozIssuer.metadata);
  return mozIssuer;
}

export function getClient(issuer: Issuer) {
  const client = new issuer.Client({
    client_id: process.env.FXA_CLIENT_ID,
    client_secret: process.env.FXA_CLIENT_SECRET,
    redirect_uris: ['http://localhost:5173/lockbox/fxa'],
    response_types: ['code'],
    scopes: ['openid', 'profile'],
  });

  return client;
}
