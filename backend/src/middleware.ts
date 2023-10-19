import { PrismaClient, Permission } from '@prisma/client';
const prisma = new PrismaClient();

// Middleware that attaches the permissions, if any
export async function getPermissions(req, res, next) {
  console.log(
    `begin permissions ====================================================`
  );
  console.log(req.session);
  console.log(`route: ${req.method} ${req.originalUrl}`);
  console.log(`userId:`, req.body.userId);
  console.log(`containerId:`, req.params.containerId);
  console.log(
    `end permissinos  ====================================================`
  );
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
    const groupUser = await prisma.groupUser.findUnique({
      where: {
        groupId_userId: { groupId: group.id, userId },
      },
    });

    if (groupUser) {
      // Attach it to the route, if it exists
      req.permission = groupUser.permission;
      console.log(`😻 Found permission for user`);
      console.log(req.permission);
    }
  }

  next();
}
