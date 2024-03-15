import { PrismaClient, ContainerType } from '@prisma/client';
const prisma = new PrismaClient();
import { PermissionType } from '../types/custom';
import { fromPrisma } from './prisma-helper';

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
  const onGroupError = () => {
    throw new Error(`Could not create group while creating container`);
  };
  const group = await fromPrisma(prisma.group.create, query, onGroupError);

  query = {
    data: {
      groupId: group.id,
      userId: ownerId,
      permission: PermissionType.ADMIN, // Owner has full permissions
    },
  };
  const onMembershipError = () => {
    throw new Error(`Could not create membership while creating container`);
  };
  await fromPrisma(prisma.membership.create, query, onMembershipError);

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
  const onContainerError = () => {
    throw new Error(`Could not create membership while creating container`);
  };

  return await fromPrisma(prisma.container.create, query, onContainerError);
}

export async function getItemsInContainer(id: number) {
  const query = {
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      type: true,
      shareOnly: true,
      ownerId: true,
      groupId: true,
      wrappedKey: true,
      parentId: true,
      children: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          type: true,
          shareOnly: true,
          ownerId: true,
          groupId: true,
          wrappedKey: true,
          parentId: true,
          items: {
            select: {
              name: true,
              wrappedKey: true,
              uploadId: true,
              createdAt: true,
              updatedAt: true,
              type: true,
              upload: {
                select: {
                  size: true,
                  type: true,
                  owner: {
                    select: {
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      items: {
        select: {
          id: true,
          name: true,
          wrappedKey: true,
          uploadId: true,
          createdAt: true,
          updatedAt: true,
          containerId: true,
          type: true,
          tags: true,
          upload: {
            select: {
              size: true,
              type: true,
              owner: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      },
      tags: true,
    },
  };

  const onError = () => {
    throw new Error(`Could not find container`);
  };

  return fromPrisma(prisma.container.findUniqueOrThrow, query, onError);
}

export async function getContainerWithAncestors(id: number) {
  const query = {
    where: {
      id,
    },
  };

  const onError = () => {
    throw new Error(`Could not find container`);
  };

  const container = await fromPrisma(prisma.container.findUniqueOrThrow, query, onError);

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

  const onError = () => {
    throw new Error(`Could not find container`);
  };

  const shares = await fromPrisma(prisma.share.findMany, query, onError);
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

  const onError = () => {
    throw new Error(`Could not update container name`);
  };

  return await fromPrisma(prisma.container.update, query, onError);
}
