import { PrismaClient, UserTier, ContainerType } from '@prisma/client';
const prisma = new PrismaClient();

export async function createUser(
  publicKey: string,
  email: string,
  tier: UserTier = UserTier.PRO
) {
  try {
    return prisma.user.create({
      data: {
        publicKey,
        email,
        tier,
      },
    });
  } catch (err) {
    throw new Error(`could not create user`);
  }
}

export async function getUserByEmail(email: string) {
  // TODO: revisit this and consider deleting
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
  // TODO: confirm whether profiles and users have a unique 1-1 mapping.
  // If so, do a `findUnique`
  const users = await prisma.user.findMany({
    where: {
      profile: {
        mozid,
      },
    },
  });
  let user = users[0];
  if (!user) {
    try {
      user = await createUser('', email, UserTier.FREE);
    } catch (err) {
      throw err;
    }
  }

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
        connect: {
          id: user.id,
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
  delete profile.user;
  user['profile'] = profile;

  return user;
}

export async function getUserPublicKey(id: number) {
  try {
    return prisma.user.findUniqueOrThrow({
      where: {
        id,
      },
      select: {
        publicKey: true,
      },
    });
  } catch (err) {
    throw new Error(`Could not find user`);
  }
}

export async function updateUserPublicKey(id: number, publicKey: string) {
  try {
    return prisma.user.update({
      where: {
        id,
      },
      data: {
        publicKey,
      },
    });
  } catch (err) {
    throw new Error(`Could not update user`);
  }
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
  let user;
  try {
    user = await prisma.user.findUniqueOrThrow(params);
  } catch (err) {
    throw new Error(`Could not find user`);
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
  let containerWhere;
  try {
    containerWhere = await _whereContainer(userId, type, false, true);
  } catch (err) {
    throw new Error(`Could not find container`);
  }

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
  let containerWhere;
  try {
    containerWhere = await _whereContainer(userId, type);
  } catch (err) {
    throw new Error(`Could not find container`);
  }

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
  try {
    return prisma.user.findUniqueOrThrow({
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
  } catch (err) {
    throw new Error(`Could not find user`);
  }
}

export async function setBackup(
  id: number,
  keys: string,
  keypair: string,
  keystring: string,
  salt: string
) {
  try {
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
  } catch (err) {
    throw new Error(`Could not update user`);
  }
}
