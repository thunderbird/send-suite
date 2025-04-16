import { ContainerType, PrismaClient } from '@prisma/client';
import {
  CONTAINER_NOT_CREATED,
  CONTAINER_NOT_FOUND,
  CONTAINER_NOT_UPDATED,
  GROUP_NOT_CREATED,
  MEMBERSHIP_NOT_CREATED,
} from '../errors/models';
import { PermissionType } from '../types/custom';
import {
  childrenIncludeOptions,
  fromPrismaV2,
  itemsIncludeOptions,
} from './prisma-helper';
const prisma = new PrismaClient();

// Automatically creates a group for container
// owner is added to new group
export async function createContainer(
  name: string,
  ownerId: string,
  type: ContainerType,
  parentId: string | null,
  shareOnly: boolean
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: Record<string, any> = {
    data: {},
  };
  const group = await fromPrismaV2(
    prisma.group.create,
    query,
    GROUP_NOT_CREATED
  );

  query = {
    data: {
      groupId: group.id,
      userId: ownerId,
      permission: PermissionType.ADMIN, // Owner has full permissions
    },
  };
  await fromPrismaV2(prisma.membership.create, query, MEMBERSHIP_NOT_CREATED);

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
  if (parentId) {
    query.data['parentId'] = parentId;
  }

  return await fromPrismaV2(
    prisma.container.create,
    query,
    CONTAINER_NOT_CREATED
  );
}

export async function getItemsInContainer(id: string) {
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

  return fromPrismaV2(
    prisma.container.findUniqueOrThrow,
    query,
    CONTAINER_NOT_FOUND
  );
}

export async function getContainerWithAncestors(id: string) {
  const query = {
    where: {
      id,
    },
  };

  const container = await fromPrismaV2(
    prisma.container.findUniqueOrThrow,
    query,
    CONTAINER_NOT_FOUND
  );

  if (container.parentId) {
    container['parent'] = await getContainerWithAncestors(container.parentId);
  }
  return container;
}

export async function getAccessLinksForContainer(containerId: string) {
  const shares = await fromPrismaV2(prisma.share.findMany, {
    where: {
      containerId,
    },
    select: {
      accessLinks: {
        select: {
          id: true,
          expiryDate: true,
          passwordHash: true,
          locked: true,
        },
      },
    },
  });
  return shares.flatMap((share) =>
    share.accessLinks.map((link) => {
      // If there password hash is present, we add it to the id so that the full shareable link can be shown to the user
      return link.passwordHash
        ? { ...link, id: link.id + `#${link.passwordHash}` }
        : link;
    })
  );
}

export async function updateContainerName(containerId: string, name: string) {
  const query = {
    where: {
      id: containerId,
    },
    data: {
      name,
      updatedAt: new Date(),
    },
  };

  return await fromPrismaV2(
    prisma.container.update,
    query,
    CONTAINER_NOT_UPDATED
  );
}
