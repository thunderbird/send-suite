import { PrismaClient } from '@prisma/client';
import storage from '../storage';
import { fromPrismaV2 } from './prisma-helper';
const prisma = new PrismaClient();

import {
  BaseError,
  UPLOAD_NOT_CREATED,
  UPLOAD_NOT_FOUND,
} from '../errors/models';

export async function createUpload(
  id: string,
  size: number,
  ownerId: number,
  type: string
) {
  // Confirm that file `id` exists and what's on disk
  // is at least as large as the stated size.
  // (Encrypted files are larger than the decrypted contents)
  const sizeOnDisk = await storage.length(id);
  if (sizeOnDisk < size) {
    throw new BaseError(UPLOAD_NOT_CREATED);
  }

  const query = {
    data: {
      id,
      size,
      ownerId,
      createdAt: new Date(),
      type,
    },
  };
  return await fromPrismaV2(prisma.upload.create, query, UPLOAD_NOT_CREATED);
}

export async function statUpload(id: string) {
  // Checking the stored size confirms that the file exists
  // and that we can query the storage by its id.
  return await storage.length(id);
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

  const upload = await fromPrismaV2(
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

  const upload = await fromPrismaV2(
    prisma.upload.findUniqueOrThrow,
    query,
    UPLOAD_NOT_FOUND
  );
  const { size, type } = upload;
  return { size, type };
}
