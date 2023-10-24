import { PrismaClient } from '@prisma/client';

import { PermissionType } from './types/custom';
const prisma = new PrismaClient();

// Middleware that attaches the permissions, if any
export async function getPermissions(req, res, next) {
  try {
    console.log(
      `begin permissions ====================================================`
    );
    console.log(`route: ${req.method} ${req.originalUrl}`);
    console.log(`userId:`, req?.session?.user?.id);
    console.log(`containerId:`, req.params.containerId);
    console.log(
      `end permissinos  ====================================================`
    );
  } catch (e) {
    console.log;
    console.log(e);
    console.log(
      `exception checking permissions  ====================================================`
    );
  }
  next();
  return;

  // TODO: shift this to sessions
  const { userId } = req.body;
  const { containerId } = req.params;

  if (!userId) {
    next();
    console.log(`👿 No userId in req.body`);
    return;
  }

  if (!containerId) {
    next();
    console.log(`👿 No containerId in req.params`);
    return;
  }

  // TODO: write a better, more correct version of this.
  // This code works off of the assumption that there
  // is a one-to-one correspondence between groups and containers.
  // This seems to be true, but it isn't guaranteed.
  const group = await prisma.group.findFirst({
    where: {
      container: {
        id: containerId,
      },
    },
  });

  if (group) {
    // Find the GroupUser row
    const membership = await prisma.membership.findUnique({
      where: {
        groupId_userId: { groupId: group.id, userId },
      },
    });

    if (membership) {
      // Attach it to the route, if it exists
      req.permission = membership.permission;
      console.log(`😻 Found permission for user`);
      console.log(req.permission);
    }
  }

  next();
}
