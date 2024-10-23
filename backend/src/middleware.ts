import { PrismaClient } from '@prisma/client';

import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  getDataFromAuthenticatedRequest,
  getJWTfromToken,
} from './auth/client';
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

function extractContainerId(req) {
  const prop = `containerId`;
  const val = extractParamOrBody(req, prop);
  try {
    return parseInt(val, 10);
  } catch (e) {
    console.error(`Could not find ${prop} for ${extractMethodAndRoute(req)}`);
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

export async function requireJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const jwtToken = getCookie(req?.headers?.cookie, 'authorization');

  const token = getJWTfromToken(jwtToken);
  if (!token) {
    console.warn(`No token found for ${extractMethodAndRoute(req)}`);
    return res.status(403).json({ message: `Not authorized: Token not found` });
  }

  try {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    next();
  } catch (error) {
    return res.status(403).json({ message: `Not authorized: Invalid token` });
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

  const { id: userId } = getDataFromAuthenticatedRequest(req);
  const containerId = extractContainerId(req);

  if (userId && containerId === 0) {
    // Users have full permissions to their own top-level
    console.log(`
*************************************************************************************
WARNING: this check needs to be more robust (in middleware.getGroupMemberPermissions)
Adding full permissions assuming user is operating on their own top-level, when there
is a user and containerId === 0
*************************************************************************************
    `);
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
