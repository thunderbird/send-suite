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