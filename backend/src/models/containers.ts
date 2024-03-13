import { PrismaClient, ContainerType } from '@prisma/client';
const prisma = new PrismaClient();
import { PermissionType } from '../types/custom';

// Automatically creates a group for container
// owner is added to new group
export async function createContainer(
  name: string,
  ownerId: number,
  type: ContainerType,
  parentId: number,
  shareOnly: boolean
) {
  // For placeholder error message:
  // if there's an error while creating, what couldn't we create?
  let entityName: string;
  try {
    entityName = 'group';
    const group = await prisma.group.create({
      data: {},
    });

    entityName = 'membership';
    const membership = await prisma.membership.create({
      data: {
        groupId: group.id,
        userId: ownerId,
        permission: PermissionType.ADMIN, // Owner has full permissions
      },
    });

    const createArgs = {
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
      createArgs.data['parentId'] = parentId;
    }

    entityName = 'container';
    return await prisma.container.create(createArgs);
  } catch (err) {
    throw new Error(`could not create ${entityName}`);
  }
}

export async function getItemsInContainer(id: number) {
  try {
    return prisma.container.findUniqueOrThrow({
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
    });
  } catch (err) {
    throw new Error(`Could not find container`);
  }
}

export async function getContainerWithAncestors(id: number) {
  let container;
  try {
    container = await prisma.container.findUniqueOrThrow({
      where: {
        id,
      },
    });
  } catch (err) {
    throw new Error(`Could not find container`);
  }

  if (container.parentId) {
    container['parent'] = await getContainerWithAncestors(container.parentId);
  }
  return container;
}

export async function getAccessLinksForContainer(containerId: number) {
  const shares = await prisma.share.findMany({
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
  });

  return shares.flatMap((share) => share.accessLinks.map((link) => link));
}

export async function updateContainerName(containerId: number, name: string) {
  try {
    return await prisma.container.update({
      where: {
        id: containerId,
      },
      data: {
        name,
        updatedAt: new Date(),
      },
    });
  } catch (err) {
    throw new Error(`Could not update container`);
  }
}
