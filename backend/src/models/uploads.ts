import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { fromPrisma } from './prisma-helper';

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
  const onError = () => {
    throw new Error(`could not create upload`);
  };
  return await fromPrisma(prisma.upload.create, query, onError);
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
  const onError = () => {
    throw new Error(`could not create upload`);
  };
  const upload = await fromPrisma(
    prisma.upload.findUniqueOrThrow,
    query,
    onError
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
  const onError = () => {
    throw new Error(`Could not find upload`);
  };
  const upload = await fromPrisma(
    prisma.upload.findUniqueOrThrow,
    query,
    onError
  );
  const { size, type } = upload;
  return { size, type };
}
