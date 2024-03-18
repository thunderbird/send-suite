import { PrismaClient, UserTier, ContainerType, User } from '@prisma/client';
const prisma = new PrismaClient();
import { fromPrisma } from './prisma-helper';

export async function createUser(
  publicKey: string,
  email: string,
  tier: UserTier = UserTier.PRO
) {
  const query = {
    data: {
      publicKey,
      email,
      tier,
    },
  };
  const onError = () => {
    throw new Error(`could not create user`);
  };
  return await fromPrisma(prisma.user.create, query, onError);
}

export async function getUserByEmail(email: string) {
  // TODO: revisit this and consider deleting
  const query = {
    where: {
      email,
    },
  };
  const onError = () => {
    throw new Error(`could not find user`);
  };
  const users = await fromPrisma(prisma.user.findMany, query, onError);
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
  let user: User;
  const userQuery = {
    where: {
      profile: {
        mozid,
      },
    },
  };

  try {
    user = await fromPrisma(prisma.user.findFirstOrThrow, userQuery);
  } catch (err) {
    user = await createUser('', email, UserTier.FREE);
  }

  const profileQuery = {
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
  };
  const onProfileError = () => {
    throw new Error(`could not upsert profile on moz login`);
  };
  const profile = await fromPrisma(
    prisma.profile.upsert,
    profileQuery,
    onProfileError
  );

  // Flip the nesting of the user and the profile.
  delete profile.user;
  user['profile'] = profile;

  return user;
}

export async function getUserPublicKey(id: number) {
  const query = {
    where: {
      id,
    },
    select: {
      publicKey: true,
    },
  };
  const onError = () => {
    throw new Error(`Could not find user`);
  };
  return await fromPrisma(prisma.user.findUniqueOrThrow, query, onError);
}

export async function updateUserPublicKey(id: number, publicKey: string) {
  const query = {
    where: {
      id,
    },
    data: {
      publicKey,
    },
  };
  const onError = () => {
    throw new Error(`Could not update user`);
  };
  return await fromPrisma(prisma.user.update, query, onError);
}

async function _whereContainer(
  userId: number,
  type: ContainerType | null,
  shareOnly?: boolean,
  topLevelOnly?: boolean
) {
  const query = {
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
  const onError = () => {
    throw new Error(`Could not find user`);
  };
  const user = await fromPrisma(prisma.user.findUniqueOrThrow, query, onError);

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
  const query = {
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
  };
  return await fromPrisma(prisma.container.findMany, query);
}

export async function getRecentActivity(
  userId: number,
  type: ContainerType | null
) {
  // Get all containers
  const containerWhere = await _whereContainer(userId, type);
  const query = {
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
  };
  const onError = () => {
    throw new Error(`Could not find containers for recent activity`);
  };
  return await fromPrisma(prisma.container.findMany, query, onError);
}

export async function getBackup(id: number) {
  const query = {
    where: {
      id,
    },
    select: {
      backupContainerKeys: true,
      backupKeypair: true,
      backupKeystring: true,
      backupSalt: true,
    },
  };
  const onError = () => {
    throw new Error(`Could not find user while getting backup`);
  };
  return await fromPrisma(prisma.user.findUniqueOrThrow, query, onError);
}

export async function setBackup(
  id: number,
  keys: string,
  keypair: string,
  keystring: string,
  salt: string
) {
  const query = {
    where: {
      id,
    },
    data: {
      backupContainerKeys: keys,
      backupKeypair: keypair,
      backupKeystring: keystring,
      backupSalt: salt,
    },
  };
  const onError = () => {
    throw new Error(`Could not find user while setting backup`);
  };
  return await fromPrisma(prisma.user.update, query, onError);
}
