import { PrismaClient, ContainerType } from '@prisma/client';
const prisma = new PrismaClient();
import { PermissionType } from '../types/custom';
import {
  childrenIncludeOptions,
  fromPrisma,
  itemsIncludeOptions,
} from './prisma-helper';
import {
  BaseError,
  CONTAINER_NOT_UPDATED,
  CONTAINER_NOT_FOUND,
  CONTAINER_NOT_CREATED,
  GROUP_NOT_CREATED,
  MEMBERSHIP_NOT_CREATED,
} from '../errors/models';

// Automatically creates a group for container
// owner is added to new group
export async function createContainer(
  name: string,
  ownerId: number,
  type: ContainerType,
  parentId: number,
  shareOnly: boolean
) {
  let query: Record<string, any> = {
    data: {},
  };
  const group = await fromPrisma(prisma.group.create, query, GROUP_NOT_CREATED);

  query = {
    data: {
      groupId: group.id,
      userId: ownerId,
      permission: PermissionType.ADMIN, // Owner has full permissions
    },
  };
  await fromPrisma(prisma.membership.create, query, MEMBERSHIP_NOT_CREATED);

  query = {
    data: {
      name,
      ownerId,
      groupId: group.id,
      type,
      shareOnly,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
  if (parentId !== 0) {
    query.data['parentId'] = parentId;
  }

  return await fromPrisma(
    prisma.container.create,
    query,
    CONTAINER_NOT_CREATED
  );
}

export async function getItemsInContainer(id: number) {
  // Nested include syntax
  // per https://github.com/prisma/prisma/discussions/5810#discussioncomment-400341

  const query = {
    where: {
      id,
    },
    include: {
      ...childrenIncludeOptions,
      ...itemsIncludeOptions,
    },
  };

  return fromPrisma(
    prisma.container.findUniqueOrThrow,
    query,
    CONTAINER_NOT_FOUND
  );
}

export async function getContainerWithAncestors(id: number) {
  const query = {
    where: {
      id,
    },
  };

  const container = await fromPrisma(
    prisma.container.findUniqueOrThrow,
    query,
    CONTAINER_NOT_FOUND
  );

  if (container.parentId) {
    container['parent'] = await getContainerWithAncestors(container.parentId);
  }
  return container;
}

export async function getAccessLinksForContainer(containerId: number) {
  const query = {
    where: {
      containerId,
    },
    select: {
      accessLinks: {
        select: {
          id: true,
          expiryDate: true,
        },
      },
    },
  };

  const shares = await fromPrisma(prisma.share.findMany, query);
  return shares.flatMap((share) => share.accessLinks.map((link) => link));
}

export async function updateContainerName(containerId: number, name: string) {
  const query = {
    where: {
      id: containerId,
    },
    data: {
      name,
      updatedAt: new Date(),
    },
  };

  return await fromPrisma(
    prisma.container.update,
    query,
    CONTAINER_NOT_UPDATED
  );
}
