import { PrismaClient } from '@prisma/client';

import { hasWrite, hasAdmin, hasRead, hasShare } from './types/custom';
const prisma = new PrismaClient();

function extractUserId(req) {
  try {
    const userId = parseInt(req.session?.user?.id, 10);
    return userId;
  } catch (e) {
    return null;
  }
}

function extractContainerId(req) {
  try {
    const containerId = parseInt(
      req.params.containerId ?? req.body.containerId,
      10
    );
    return containerId;
  } catch (e) {
    return null;
  }
}

export function reject(res, status = 403, message = `Not authorized`) {
  res.send(403).json({
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

// Middleware that attaches the permissions, if any
export async function getPermissions(req, res, next) {
  const userId = extractUserId(req);
  const containerId = extractContainerId(req);

  if (!userId || !containerId) {
    reject(res);
    return;
  }

  console.log(
    `begin permissions ====================================================`
  );
  console.log(`route: ${req.method} ${req.originalUrl}`);
  console.log(`userId:`, userId);
  console.log(`containerId:`, containerId);
  console.log(
    `end permissions  ====================================================`
  );

  // TODO: write a better, more correct version of this.
  // This code assumes that there is a one-to-one
  // correspondence between groups and containers.
  // This seems to be true, but it isn't guaranteed.
  const group = await prisma.group.findFirst({
    where: {
      container: {
        id: containerId,
      },
    },
  });

  if (!group) {
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
  req['permission'] = membership.permission;
  next();
}

export function canRead(req, res, next) {
  if (!hasRead(req['permission'])) {
    reject(res);
    return;
  }
  next();
}
export function canWrite(req, res, next) {
  if (!hasWrite(req['permission'])) {
    reject(res);
    return;
  }
  next();
}
export function canAdmin(req, res, next) {
  if (!hasAdmin(req['permission'])) {
    reject(res);
    return;
  }
  next();
}
export function canShare(req, res, next) {
  if (!hasShare(req['permission'])) {
    reject(res);
    return;
  }
  next();
}
