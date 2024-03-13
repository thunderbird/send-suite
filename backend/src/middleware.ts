import { PrismaClient } from '@prisma/client';

import {
  hasWrite,
  hasAdmin,
  hasRead,
  hasShare,
  allPermissions,
} from './types/custom';
const prisma = new PrismaClient();

import logger from './logger';

const PERMISSION_REQUEST_KEY = '_permission';

function extractMethodAndRoute(req) {
  return `${req.method} ${req.originalUrl}`;
}

function extractSessionValue(req, path) {
  let val = req.session;
  for (let item of path) {
    if (!val[item]) {
      logger.error(
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
    logger.error(`Could  ${path} for ${extractMethodAndRoute(req)}`);
    return null;
  }
}

function extractContainerId(req) {
  const prop = `containerId`;
  const val = extractParamOrBody(req, prop);
  try {
    return parseInt(val, 10);
  } catch (e) {
    logger.error(`Could not find ${prop} for ${extractMethodAndRoute(req)}`);
    return null;
  }
}

export function reject(res, status = 403, message = `Not authorized`) {
  res.status(403).json({
    message,
  });
  return;
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
    logger.info(`
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

  let group;
  try {
    group = await prisma.group.findFirstOrThrow({
      where: {
        container: {
          id: containerId,
        },
      },
    });
  } catch (err) {
    // No need to throw an error.
    // This is handled correctly by `reject(res)`
    reject(res);
    return;
  }

  // Find the GroupUser
  const membership = await prisma.membership.findUnique({
    where: {
      groupId_userId: { groupId: group.id, userId },
    },
  });

  if (!membership) {
    reject(res);
    return;
  }

  // Attach it to the request
  req[PERMISSION_REQUEST_KEY] = membership.permission;
  next();
}

export function canRead(req, res, next) {
  if (!hasRead(req[PERMISSION_REQUEST_KEY])) {
    logger.warn(`Missing read permission`);
    reject(res);
    return;
  }
  next();
}
export function canWrite(req, res, next) {
  if (!hasWrite(req[PERMISSION_REQUEST_KEY])) {
    logger.warn(`Missing write permission`);
    reject(res);
    return;
  }
  next();
}
export function canAdmin(req, res, next) {
  if (!hasAdmin(req[PERMISSION_REQUEST_KEY])) {
    logger.warn(`Missing admin permission`);
    reject(res);
    return;
  }
  next();
}
export function canShare(req, res, next) {
  if (!hasShare(req[PERMISSION_REQUEST_KEY])) {
    logger.warn(`Missing share permission`);
    reject(res);
    return;
  }
  next();
}
