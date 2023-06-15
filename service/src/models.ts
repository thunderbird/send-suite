import { PrismaClient, Prisma, ItemType } from "@prisma/client";
const prisma = new PrismaClient();

export async function createUser(email: string) {
  return prisma.user.create({
    data: {
      email,
    },
  });
}

export async function getUser(userId: number) {
  return prisma.user.findUnique({
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
      items: {
        select: {
          id: true,
        },
      },
    },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
}

// export async function getUserItems(userId: number) {
//   return prisma.item.findMany({
//     where: {
//       sharedBy: userId,
//     },
//   });
// }

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

export async function createItem(
  url: string,
  sharedBy: number,
  type: ItemType
) {
  return prisma.item.create({
    data: {
      url,
      sharedBy,
      type,
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

export async function getGroupItems(groupId: number, type: ItemType) {
  return prisma.item.findMany({
    where: {
      type,
      groups: {
        some: {
          groupId,
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

// ===================================================================
// This is data previously stored in Redis
// Note: this Metadata pertains to uploads, not to Items.
// Because:
// - Every upload will have Metadata
// - But not every upload will be an Item shared by a User to a Group
export async function createUpload(
  id: string,
  owner: string,
  metadata: string,
  dlimit: number,
  auth: string,
  nonce: string,
  pwd?: boolean
) {
  return prisma.upload.create({
    data: {
      id,
      owner,
      metadata,
      dlimit,
      auth,
      nonce,
      pwd: !!pwd,
    },
  });
}

export async function getUpload(id: string) {
  return prisma.upload.findUnique({
    where: { id },
  });
}

export async function deleteUpload(id: string) {
  return prisma.upload.delete({
    where: {
      id,
    },
  });
}

export async function updateUpload(id: string, kv: Record<string, any>) {
  const data = {
    ...kv,
  };

  if (Object.keys(data).length === 0) {
    return;
  }
  return prisma.upload.update({
    where: { id },
    data,
  });
}
