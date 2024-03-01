import { PrismaClient, UserTier, ContainerType } from '@prisma/client';
const prisma = new PrismaClient();

export async function createUser(
  publicKey: string,
  email: string,
  tier: UserTier = UserTier.PRO
) {
  return prisma.user.create({
    data: {
      publicKey,
      email,
      tier,
    },
  });
}

export async function getUserByEmail(email: string) {
  const users = await prisma.user.findMany({
    where: {
      email,
    },
  });

  return users[0];
}

// Given a Mozilla account id, find or create a Profile and linked User
export async function findOrCreateUserProfileByMozillaId(
  mozid: string,
  avatar?: string,
  email?: string,
  accessToken?: string,
  refreshToken?: string
) {
  const profile = await prisma.profile.upsert({
    where: {
      mozid,
    },
    update: {
      avatar,
      accessToken,
      refreshToken,
    },
    create: {
      mozid,
      avatar,
      accessToken,
      refreshToken,
      user: {
        create: {
          email,
          // For now, we assume they're on the FREE teir.
          tier: UserTier.FREE,
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          tier: true,
          createdAt: true,
          updatedAt: true,
          activatedAt: true,
        },
      },
    },
  });

  // Flip the nesting of the user and the profile.
  const { user } = profile;
  delete profile.user;
  user['profile'] = profile;

  return user;
}

export async function getUserPublicKey(id: number) {
  return prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      publicKey: true,
    },
  });
}

export async function updateUserPublicKey(id: number, publicKey: string) {
  return prisma.user.update({
    where: {
      id,
    },
    data: {
      publicKey,
    },
  });
}

async function _whereContainer(
  userId: number,
  type: ContainerType | null,
  shareOnly?: boolean,
  topLevelOnly?: boolean
) {
  const params = {
    where: {
      id: userId,
    },
    select: {
      id: true,
      groups: {
        select: {
          groupId: true,
        },
      },
    },
  };
  const user = await prisma.user.findUnique(params);
  if (!user) {
    return null;
  }
  const groupIds = user.groups.map(({ groupId }) => groupId);
  const containerWhere = {
    groupId: {
      in: groupIds,
    },
  };

  if (type) {
    containerWhere['type'] = type;
  }

  if (shareOnly !== undefined) {
    containerWhere['shareOnly'] = shareOnly;
  }

  // top-level containers have a null parentId
  if (topLevelOnly !== undefined) {
    containerWhere['parentId'] = null;
  }

  return containerWhere;
}

// Does not include shareOnly containers.
export async function getAllUserGroupContainers(
  userId: number,
  type: ContainerType | null
) {
  const containerWhere = await _whereContainer(userId, type, false, true);
  return prisma.container.findMany({
    where: containerWhere,
    // include: {
    //   items: true,
    // },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      type: true,
      shareOnly: true,
      ownerId: true,
      groupId: true,
      wrappedKey: true,
      parentId: true,
      items: {
        select: {
          id: true,
          name: true,
          wrappedKey: true,
          uploadId: true,
          containerId: true,
          // uploadId: true,
          // createdAt: true,
          type: true,
          tags: true,
          upload: {
            select: {
              type: true,
              size: true,
              owner: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      },
      tags: true,
    },
  });
}

export async function getRecentActivity(
  userId: number,
  type: ContainerType | null
) {
  // Get all containers
  const containerWhere = await _whereContainer(userId, type);
  const containers = await prisma.container.findMany({
    take: 10,
    where: containerWhere,
    orderBy: [
      {
        updatedAt: 'desc',
      },
      {
        name: 'asc',
      },
    ],
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      type: true,
      shareOnly: true,
      items: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  return containers;
}

export async function getBackup(id: number) {
  return prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      backupContainerKeys: true,
      backupKeypair: true,
      backupKeystring: true,
      backupSalt: true,
    },
  });
}

export async function setBackup(
  id: number,
  keys: string,
  keypair: string,
  keystring: string,
  salt: string
) {
  return prisma.user.update({
    where: {
      id,
    },
    data: {
      backupContainerKeys: keys,
      backupKeypair: keypair,
      backupKeystring: keystring,
      backupSalt: salt,
    },
  });
}
