import { AuthResponse } from '@/routes/auth';
import jwt from 'jsonwebtoken';
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

export function verifyJWT(token: string) {
  const callback = (err, decoded) => {
    if (err) {
      return null;
    }
    return decoded;
  };
  const data = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, callback);

  return data;
}

export function getUserFromJWT(token: string) {
  const data = jwt.decode(token);
  return data as AuthResponse;
}

export function getJWTfromToken(jwtToken: string | string[]): string | null {
  const isValidTokenFormatting =
    typeof jwtToken === 'string' && jwtToken.startsWith('Bearer ');

  if (!isValidTokenFormatting) {
    return null;
  }

  const token = jwtToken.split('Bearer ')[1];
  return token;
}
