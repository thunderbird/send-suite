import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

export async function createUser(email: string) {
  return prisma.user.create({
    data: {
      email,
    },
  });
}
export async function createGroup(data = {}) {
  return prisma.group.create({
    data,
  });
}

export async function getGroup(groupId: number) {
  return prisma.group.findUnique({
    where: {
      id: groupId,
    },
    select: {
      id: true,
    },
  });
}

export async function getGroupMembers(groupId: number) {
  return prisma.group.findUnique({
    where: {
      id: groupId,
    },
    include: {
      members: {
        select: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

export async function deleteGroup(groupId: number) {
  // Remove group memberships
  await prisma.groupUser.deleteMany({
    where: {
      groupId,
    },
  });

  // Remove group items
  await prisma.groupItem.deleteMany({
    where: {
      groupId,
    },
  });

  // Delete the group
  return prisma.group.delete({
    where: {
      id: groupId,
    },
  });
}

export async function addGroupMember(groupId: number, userId: number) {
  return prisma.groupUser.create({
    data: {
      groupId,
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

export async function createItem(url: string) {
  return prisma.item.create({
    data: {
      url,
    },
  });
}

export async function addGroupItem(groupId: number, itemId: number) {
  return prisma.groupItem.create({
    data: {
      groupId,
      itemId,
    },
  });
}

export async function getGroupItems(groupId: number) {
  return prisma.group.findUnique({
    where: {
      id: groupId,
    },
    include: {
      items: {
        select: {
          item: {
            select: {
              id: true,
              url: true,
            },
          },
        },
      },
    },
  });
}

export async function getItem(itemId: number) {
  return prisma.item.findUnique({
    where: {
      id: itemId,
    },
  });
}

export async function removeGroupItem(groupId: number, itemId: number) {
  return prisma.groupItem.delete({
    where: {
      groupId_itemId: { groupId, itemId },
    },
  });
}
