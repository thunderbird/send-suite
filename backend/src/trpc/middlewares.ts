/* eslint-disable @typescript-eslint/no-explicit-any */
import { validateJWT } from '@/auth/jwt';
import { Context } from '@/trpc';
import { TRPCError } from '@trpc/server';

type ContextPlugin = {
  ctx: Context;
};

/**
 * This middleware is used to check if the user has a valid token and associated account information.
 * If the jwt token has expired but the request contains a valid refresh token, we return UNAUTHORIZED to let the client know they should refresh
 * If both token and refresh token are invalid, we return FORBIDDEN
 * Note: This middleware mirrors `requireJWT` from backend/src/middleware.ts
 * These middlewares should be maintained in tandem to avoid unintended behavior
 */
export async function isAuthed(opts: {
  ctx: Context;
  next: (p: ContextPlugin | void) => Promise<any>;
}) {
  const { ctx } = opts;

  const validationResult = validateJWT({
    jwtToken: ctx?.cookies?.jwtToken,
    jwtRefreshToken: ctx?.cookies?.jwtRefreshToken,
  });

  if (validationResult === 'valid') {
    return opts.next();
  }

  // When token is invalid but refresh token is valid. We refresh our token
  if (validationResult === 'shouldRefresh') {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  if (!validationResult) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
}

export async function getGroupMemberPermission(opts: {
  ctx: Context;
  next: (p: ContextPlugin | void) => Promise<any>;
}) {
  return opts.next();
}

/**
 * This middleware prevents public login routes to function if the env variable is not enabled
 * This should not be used in production
 **/
export function requirePublicLogin(opts: {
  ctx: Context;
  next: (p: ContextPlugin | void) => Promise<any>;
}) {
  if (process.env?.ALLOW_PUBLIC_LOGIN === 'true') {
    return opts.next();
  }
  throw new TRPCError({ code: 'NOT_IMPLEMENTED' });
}
