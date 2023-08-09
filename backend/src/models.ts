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

export async function createFolder(
  name: string,
  publicKey: string,
  ownerId: number
) {
  return prisma.folder.create({
    data: {
      name,
      publicKey,
      ownerId,
    },
  });
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
// later, optional: groupId
// wait, do I even want to search by groupId?
// is that just a giant "all files for the group, no matter what folder?"
// that doesn't seem useful right now
export async function getItems(id: number) {
  return prisma.folder.findUnique({
    where: {
      id,
    },
    include: {
      items: true,
    },
  });
}

// more functions:
// - move item to another folder
// - delete item
