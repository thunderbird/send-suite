import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function createUpload(
  id: string,
  size: number,
  ownerId: number,
  type: string
) {
  try {
    return await prisma.upload.create({
      data: {
        id,
        size,
        ownerId,
        createdAt: new Date(),
        type,
      },
    });
  } catch (err) {
    throw new Error(`could not create upload`);
  }
}

export async function getUploadSize(id: string) {
  const upload = await prisma.upload.findUnique({
    where: {
      id,
    },
    select: {
      size: true,
    },
  });
  return upload.size;
}

export async function getUploadMetadata(id: string) {
  const upload = await prisma.upload.findUnique({
    where: {
      id,
    },
    select: {
      size: true,
      type: true,
    },
  });
  const { size, type } = upload;
  return { size, type };
}
