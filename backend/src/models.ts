import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function createUser(email: string, publicKey: string) {
  return prisma.user.create({
    data: {
      email,
      publicKey,
    },
  });
}

// Automatically creates a group for folder
// owner is added to new group
export async function createFolder(
  name: string,
  publicKey: string,
  ownerId: number
) {
  // TODO: figure out the nested create syntax:
  // https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#create-1
  const group = await prisma.group.create({
    data: {},
  });

  await prisma.groupUser.create({
    data: {
      groupId: group.id,
      userId: ownerId,
    },
  });

  const folder = await prisma.folder.create({
    data: {
      name,
      publicKey,
      ownerId,
      groupId: group.id,
    },
  });

  return folder;
}

export async function getOwnedFolders(ownerId: number) {
  return prisma.folder.findMany({
    where: {
      ownerId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function createItem(
  name: string,
  folderId: number,
  ownerId: number
) {
  console.log(name, ownerId, folderId);
  return prisma.item.create({
    data: {
      name,
      ownerId,
      folderId,
    },
  });
}

// required: folderId
export async function getItemsInFolder(id: number) {
  return prisma.folder.findUnique({
    where: {
      id,
    },
    include: {
      items: true,
    },
  });
}

// TODO:
// - move item to another folder
// - delete item

export async function getAllUserGroupFolders(userId: number) {
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
  return prisma.folder.findMany({
    where: {
      groupId: {
        in: groupIds,
      },
    },
    include: {
      items: true,
    },
  });
}

// for a folder, how many groups are there?
// should there be only one?
export async function addGroupMember(folderId: number, userId: number) {
  const folder = await prisma.folder.findUnique({
    where: {
      id: folderId,
    },
    select: {
      group: {
        select: {
          id: true,
          // members: true,
        },
      },
    },
  });

  if (!folder) {
    return null;
  }

  const { group } = folder ?? {};
  if (!group) {
    return null;
  }
  return prisma.groupUser.create({
    data: {
      groupId: group.id,
      userId,
    },
  });
}
