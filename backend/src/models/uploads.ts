import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { fromPrisma } from './prisma-helper';
import { UPLOAD_NOT_CREATED, UPLOAD_NOT_FOUND } from '../errors/models';

export async function createUpload(
  id: string,
  size: number,
  ownerId: number,
  type: string
) {
  const query = {
    data: {
      id,
      size,
      ownerId,
      createdAt: new Date(),
      type,
    },
  };

  return await fromPrisma(prisma.upload.create, query, UPLOAD_NOT_CREATED);
}

export async function getUploadSize(id: string) {
  const query = {
    where: {
      id,
    },
    select: {
      size: true,
    },
  };

  const upload = await fromPrisma(
    prisma.upload.findUniqueOrThrow,
    query,
    UPLOAD_NOT_FOUND
  );
  return upload.size;
}

export async function getUploadMetadata(id: string) {
  const query = {
    where: {
      id,
    },
    select: {
      size: true,
      type: true,
    },
  };

  const upload = await fromPrisma(
    prisma.upload.findUniqueOrThrow,
    query,
    UPLOAD_NOT_FOUND
  );
  const { size, type } = upload;
  return { size, type };
}
