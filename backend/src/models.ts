import { PrismaClient, ContainerType, ItemType } from '@prisma/client';
const prisma = new PrismaClient();

export async function createUser(email: string, publicKey: string) {
  return prisma.user.create({
    data: {
      email,
      publicKey,
    },
  });
}

// Automatically creates a group for container
// owner is added to new group
export async function createContainer(
  name: string,
  publicKey: string,
  ownerId: number,
  type: ContainerType
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

  const container = await prisma.container.create({
    data: {
      name,
      publicKey,
      ownerId,
      groupId: group.id,
      type,
    },
  });

  return container;
}

export async function getOwnedContainers(ownerId: number) {
  return prisma.container.findMany({
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
  containerId: number,
  ownerId: number,
  type: ItemType
) {
  return prisma.item.create({
    data: {
      name,
      ownerId,
      containerId,
      type,
    },
  });
}

// required: containerId
export async function getItemsInContainer(id: number) {
  return prisma.container.findUnique({
    where: {
      id,
    },
    include: {
      items: true,
    },
  });
}

// TODO:
// - move item to another container
// - delete item

export async function getAllUserGroupContainers(userId: number) {
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
  return prisma.container.findMany({
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

// for a container, how many groups are there?
// should there be only one?
export async function addGroupMember(containerId: number, userId: number) {
  const container = await prisma.container.findUnique({
    where: {
      id: containerId,
    },
    select: {
      group: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!container) {
    return null;
  }

  const { group } = container ?? {};

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

export async function removeGroupMember(groupId: number, userId: number) {
  return prisma.groupUser.delete({
    where: {
      groupId_userId: { groupId, userId },
    },
  });
}
