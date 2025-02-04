import { JWT_EXPIRY } from '@/config';
import { AuthResponse } from '@/routes/auth';
import { getCookie } from '@/utils';
import type { Request, Response } from 'express';
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

export function getAllowedOrigins() {
  const envOrigins = process.env.SEND_BACKEND_CORS_ORIGINS;
  if (!envOrigins) {
    throw new Error(
      'Environment variable SEND_BACKEND_CORS_ORIGINS must be set'
    );
  }

  // Force this to be an array of strings of non-zero length
  return envOrigins
    .split(',')
    .map((n) => n.trim())
    .filter(String);
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

export function getUserFromJWT(token: string) {
  const data = jwt.decode(token);
  return data as AuthResponse;
}

export function getJWTfromToken(jwtToken: string): string | null {
  const isValidTokenFormatting =
    typeof jwtToken === 'string' && jwtToken.startsWith('Bearer ');

  if (!isValidTokenFormatting) {
    return null;
  }

  const token = jwtToken.split('Bearer ')[1];
  return token;
}

export function getDataFromAuthenticatedRequest(req: Request) {
  const jwtToken = getCookie(req?.headers?.cookie, 'authorization');
  const token = getJWTfromToken(jwtToken);
  if (!token)
    throw new Error(
      'No token found in request: This should not happen if the user is authenticated'
    );
  const user = getUserFromJWT(token);
  return user;
}

export const signJwt = (signedData: AuthResponse, res: Response) => {
  // Sign the jwt and pass it as a cookie
  const jwtToken = jwt.sign(signedData, process.env.ACCESS_TOKEN_SECRET!);

  res.cookie('authorization', `Bearer ${jwtToken}`, {
    maxAge: JWT_EXPIRY,
    httpOnly: true,
    sameSite: 'none',
    secure: true,
  });
};

export const clearCookie = (cookieName: string, res: Response) => {
  res.cookie(cookieName, `null`, {
    maxAge: 0,
    httpOnly: true,
    sameSite: 'none',
    secure: true,
  });
};
