import { validateJWT } from '@/auth/jwt';
import { EnvironmentName, getEnvironmentName } from '@/config';
import { Context } from '@/trpc';
import { TRPCError } from '@trpc/server';

type ContextPlugin = {
  ctx: Context;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NextFunction = (p: ContextPlugin | void) => Promise<any>;

/**
 * This middleware is used to check if the user has a valid token and associated account information.
 * If the jwt token has expired but the request contains a valid refresh token, we return UNAUTHORIZED to let the client know they should refresh
 * If both token and refresh token are invalid, we return FORBIDDEN
 * Note: This middleware mirrors `requireJWT` from backend/src/middleware.ts
 * These middlewares should be maintained in tandem to avoid unintended behavior
 */
export async function isAuthed(opts: { ctx: Context; next: NextFunction }) {
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

  // If validation fails or if refresh token is not valid, we return FORBIDDEN
  if (!validationResult || validationResult === 'shouldLogin') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
}

export async function getGroupMemberPermission(opts: {
  ctx: Context;
  next: NextFunction;
}) {
  return opts.next();
}

/**
 * This middleware prevents public login routes to function if the env variable is not enabled
 * This should not be used in production
 **/
export function requirePublicLogin(opts: { ctx: Context; next: NextFunction }) {
  if (process.env?.ALLOW_PUBLIC_LOGIN === 'true') {
    return opts.next();
  }
  throw new TRPCError({ code: 'NOT_IMPLEMENTED' });
}

/**
 * This middleware is used to run only on explicitly declared environments
 * It is used to prevent certain routes from being run in production or stage environments
 **/
export async function useEnvironment(
  opts: {
    ctx: Context;
    next: NextFunction;
  },
  environmentName: EnvironmentName[]
) {
  const runtimeEnvironment = getEnvironmentName();
  if (environmentName.includes(runtimeEnvironment)) {
    return opts.next();
  }
  throw new TRPCError({ code: 'BAD_GATEWAY' });
}
