import { PrismaClient, UserTier, ContainerType, User } from '@prisma/client';
const prisma = new PrismaClient();
import { fromPrisma, itemsIncludeOptions } from './prisma-helper';
import {
  PROFILE_NOT_CREATED,
  USER_NOT_CREATED,
  USER_NOT_FOUND,
  USER_NOT_UPDATED,
} from '../errors/models';

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
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  return await fromPrisma(prisma.user.create, query, USER_NOT_CREATED);
}

export async function getUserByEmail(email: string) {
  // TODO: revisit this and consider deleting
  const query = {
    where: {
      email,
    },
  };

  const users = await fromPrisma(prisma.user.findMany, query, USER_NOT_CREATED);
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
    select: {
      id: true,
      email: true,
      tier: true,
      profile: true,
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

  const profile = await fromPrisma(
    prisma.profile.upsert,
    profileQuery,
    PROFILE_NOT_CREATED
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

  return await fromPrisma(prisma.user.findUniqueOrThrow, query, USER_NOT_FOUND);
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

  return await fromPrisma(prisma.user.update, query, USER_NOT_UPDATED);
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

  const user = await fromPrisma(
    prisma.user.findUniqueOrThrow,
    query,
    USER_NOT_FOUND
  );

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
    include: {
      ...itemsIncludeOptions,
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

  return await fromPrisma(prisma.container.findMany, query);
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

  return await fromPrisma(prisma.user.findUniqueOrThrow, query, USER_NOT_FOUND);
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

  return await fromPrisma(prisma.user.update, query, USER_NOT_FOUND);
}
