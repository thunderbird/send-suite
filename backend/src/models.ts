import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function createUser(
  email: string, publicKey: string
) {
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
      ownerId
    },
  });
}