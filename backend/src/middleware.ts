import { PrismaClient } from '@prisma/client';

import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getJWTfromToken } from './auth/client';
import { fromPrismaV2 } from './models/prisma-helper';
import {
  allPermissions,
  hasAdmin,
  hasRead,
  hasShare,
  hasWrite,
} from './types/custom';

const prisma = new PrismaClient();
const PERMISSION_REQUEST_KEY = '_permission';

function extractMethodAndRoute(req) {
  return `${req.method} ${req.originalUrl}`;
}

function extractSessionValue(req, path) {
  let val = req.session;
  for (const item of path) {
    if (!val[item]) {
      console.log(
        `No req.session.${path.join('.')} for ${extractMethodAndRoute(req)}`
      );
      return null;
    }
    val = val[item];
  }
  return val;
}

function extractParamOrBody(req, prop: string) {
  return req.params[prop] ?? req.body[prop];
}

function extractUserId(req) {
  const path = ['user', 'id'];
  const val = extractSessionValue(req, path);
  try {
    const userId = parseInt(val, 10);
    return userId;
  } catch (e) {
    console.error(`Could  ${path} for ${extractMethodAndRoute(req)}`);
    return null;
  }
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
  const jwtToken = req.headers.authentication;
  let shouldReturn = false;

  const token = getJWTfromToken(jwtToken);
  if (!token) {
    console.error(`No token found for ${extractMethodAndRoute(req)}`);
    return res.status(403).json({ message: `Not authorized: Token not found` });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err) => {
    if (err) {
      console.error(`Invalid token for ${extractMethodAndRoute(req)}`);
      shouldReturn = true;
    }
  });

  // We need to keep this variable outside the callback to make sure next doesn't execute
  if (shouldReturn) {
    return res.status(403).json({ message: `Not authorized: Invalid token` });
  }
  next();
}

export async function requireLogin(req, res, next) {
  const id = extractUserId(req);
  if (!id) {
    reject(res);
    return;
  }
  next();
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
export async function getGroupMemberPermissions(req, res, next) {
  const userId = extractUserId(req);
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
}

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
