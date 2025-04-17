import { PrismaClient } from '@prisma/client';

import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { getDataFromAuthenticatedRequest } from './auth/client';
import { validateJWT } from './auth/jwt';
import { VERSION } from './config';
import { fromPrismaV2 } from './models/prisma-helper';
import {
  allPermissions,
  hasAdmin,
  hasRead,
  hasShare,
  hasWrite,
} from './types/custom';
import { getCookie } from './utils';

const prisma = new PrismaClient();
const PERMISSION_REQUEST_KEY = '_permission';

function extractMethodAndRoute(req) {
  return `${req.method} ${req.originalUrl}`;
}

function extractParamOrBody(req, prop: string) {
  return req.params[prop] ?? req.body[prop];
}

function extractContainerId(req): string {
  const prop = `containerId`;
  const val = extractParamOrBody(req, prop);
  try {
    return val;
  } catch (e) {
    console.error(
      `Could not find ${prop} for ${extractMethodAndRoute(req)}`,
      e
    );
    return null;
  }
}

export function reject(
  res: Response,
  status = 403,
  message = `Not authorized`
) {
  res.status(status).json({
    message,
  });
  return;
}

/**
 * This Express middleware verifies the JWT token in the request cookies.
 * Returns 403 if token is missing, 401 if token needs refresh, or calls next() if valid.
 * Note: This middleware mirrors `isAuthed` from backend/src/trpc/middlewares.ts
 * These middlewares should be maintained in tandem to avoid unintended behavior
 */
export async function requireJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const jwtToken = getCookie(req?.headers?.cookie, 'authorization');
  const jwtRefreshToken = getCookie(req?.headers?.cookie, 'refresh_token');

  const validationResult = validateJWT({ jwtToken, jwtRefreshToken });

  if (!validationResult) {
    return res.status(403).json({ message: `Not authorized: Token not found` });
  }

  if (validationResult === 'valid') {
    return next();
  }

  // When refresh token is invalid, we should return 403 and ask to login
  if (validationResult === 'shouldLogin') {
    return res.status(403).json({
      message: `Not authorized: Refresh token expired`,
    });
  }

  // When the refresh token is valid but the token is not, we should return 401
  // this is handled as autoretry in the client
  if (validationResult === 'shouldRefresh') {
    return res.status(401).json({
      message: `Not authorized: Token expired`,
    });
  }
}

// Returns a middleware function that renames a property in req.body
export function renameBodyProperty(from: string, to: string) {
  return (req, res, next) => {
    if (req.body[from] !== undefined) {
      req.body[to] = req.body[from];
      delete req.body[from];
    }
    next();
  };
}

// Gets a user's permissions for a container and adds it to the request.
export const getGroupMemberPermissions: RequestHandler = async (
  req,
  res,
  next
) => {
  // Since we're calling a function intended to be used as middleware, we need to call next() if the JWT is valid
  // We set a boolean to make sure next() is called. This means that the jwt has been verified
  let goodToGo = false;
  const nextTrigger = () => {
    goodToGo = true;
  };
  await requireJWT(req, res, nextTrigger);

  if (!goodToGo) {
    return reject(res);
  }

  let userId: string;
  try {
    const userData = getDataFromAuthenticatedRequest(req);
    userId = userData.id;
  } catch (error) {
    console.error('Error getting user data:', error);
    return reject(res);
  }

  const containerId = extractContainerId(req);

  /* 
  Users have full permissions to their own top-level (aka root folder)
  Whenever a request doesn't contain a containerId, we assume it's a top-level folder
  This happens client side when creating a new folder that doesn't have a parent
  It also happens when a new account is created and we create a default folder
 */
  if (userId && !containerId) {
    req[PERMISSION_REQUEST_KEY] = allPermissions();
    next();
    return;
  }

  if (!userId || !containerId) {
    reject(res);
    return;
  }

  try {
    const findGroupQuery = {
      where: {
        container: {
          id: containerId,
        },
      },
    };
    const group = await fromPrismaV2(
      prisma.group.findFirstOrThrow,
      findGroupQuery
    );

    const findMembershipQuery = {
      where: {
        groupId_userId: { groupId: group.id, userId },
      },
    };
    const membership = await fromPrismaV2(
      prisma.membership.findUniqueOrThrow,
      findMembershipQuery
    );

    // Attach it to the request
    req[PERMISSION_REQUEST_KEY] = membership.permission;
    next();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    reject(res);
    return;
  }
};

export function requireReadPermission(req, res, next) {
  if (!hasRead(req[PERMISSION_REQUEST_KEY])) {
    console.warn(`Missing read permission`);
    reject(res);
    return;
  }
  next();
}
export function requireWritePermission(req, res, next) {
  if (!hasWrite(req[PERMISSION_REQUEST_KEY])) {
    console.warn(`Missing write permission`);
    reject(res);
    return;
  }
  next();
}
export function requireAdminPermission(req, res, next) {
  if (!hasAdmin(req[PERMISSION_REQUEST_KEY])) {
    console.warn(`Missing admin permission`);
    reject(res);
    return;
  }
  next();
}
export function requireSharePermission(req, res, next) {
  if (!hasShare(req[PERMISSION_REQUEST_KEY])) {
    console.warn(`Missing share permission`);
    reject(res);
    return;
  }
  next();
}

export function requirePublicLogin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (process.env?.ALLOW_PUBLIC_LOGIN === 'true') {
    return next();
  }
  return reject(res, 500, 'Public login is disabled');
}

// We add the package.json version to the response headers
export function addVersionHeader(
  _: Request,
  res: Response,
  next: NextFunction
) {
  res.setHeader('x-tbsend', VERSION);
  next();
}
