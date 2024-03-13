import {
  PrismaClient,
  ContainerType,
  ItemType,
  InvitationStatus,
  Item,
  Membership,
} from '@prisma/client';
const prisma = new PrismaClient();

import { PermissionType } from './types/custom';

/*

ok, I think I need to rewrite these:
- getOwnedContainers
- getContainersSharedByMe
- getContainersSharedWithMe

definitely those last two.
I should be using the `_whereContainer()` to get the `shareOnly:true` ones.

though, the `getContainersSharedWithMe` is also looking for accepted invitations.
...which makes me wonder, do I have a query for pending invitations?



*/
export async function getOwnedContainers(ownerId: number) {
  return prisma.container.findMany({
    where: {
      ownerId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getSharesForContainer(
  containerId: number,
  userId: number
) {
  return await prisma.share.findMany({
    where: {
      containerId,
    },
    include: {
      invitations: {
        include: {
          recipient: {
            select: {
              email: true,
            },
          },
        },
      },
      accessLinks: {
        select: {
          id: true,
        },
      },
    },
  });
}

export async function updateItemName(itemId: number, name: string) {
  const result = await prisma.item.update({
    where: {
      id: itemId,
    },
    data: {
      name,
      updatedAt: new Date(),
    },
  });
  return result;
}

export async function updateInvitationPermissions(
  containerId: number,
  invitationId: number,
  userId: number,
  permission: PermissionType
) {
  const result = await prisma.invitation.update({
    where: {
      id: invitationId,
    },
    data: {
      permission,
    },
  });
  return result;
}
export async function updateAccessLinkPermissions(
  containerId: number,
  accessLinkId: string,
  userId: number,
  permission: PermissionType
) {
  const result = await prisma.accessLink.update({
    where: {
      id: accessLinkId,
    },
    data: {
      permission,
    },
  });
  return result;
}

export async function getContainerWithMembers(containerId: number) {
  try {
    return await prisma.container.findUniqueOrThrow({
      where: {
        id: containerId,
      },
      select: {
        group: {
          select: {
            id: true,
            members: {
              select: {
                user: true,
              },
            },
          },
        },
      },
    });
  } catch (err) {
    throw new Error(`could not find container`);
  }
}

export async function createItem(
  name: string,
  containerId: number,
  uploadId: string,
  type: ItemType,
  wrappedKey: string
) {
  try {
    return await prisma.item.create({
      data: {
        createdAt: new Date(),
        updatedAt: new Date(),
        name,
        wrappedKey,
        type,
        upload: {
          connect: {
            id: uploadId,
          },
        },
        container: {
          connect: {
            id: containerId,
          },
        },
      },
    });
  } catch (err) {
    throw new Error(`could not create item`);
  }
}

export async function deleteItem(id: number, shouldDeleteUpload = false) {
  let containerId;
  if (shouldDeleteUpload) {
    let item;
    try {
      item = await prisma.item.findUniqueOrThrow({
        where: {
          id,
        },
        select: {
          containerId: true,
          uploadId: true,
        },
      });
    } catch (err) {
      throw new Error(`Could not find item`);
    }
    containerId = item.containerId;
    try {
      await prisma.upload.delete({
        where: {
          id: item.uploadId,
        },
      });
    } catch (err) {
      throw new Error(`Could not delete upload`);
    }
  }

  let result;
  try {
    result = await prisma.item.delete({
      where: {
        id,
      },
    });

    console.log(`deleted item ${id}`);
  } catch (err) {
    throw new Error(`Could not delete item`);
  }
  if (containerId && result) {
    // touch the container's `updatedAt` date
    await prisma.container.update({
      where: {
        id: containerId,
      },
      data: {
        updatedAt: new Date(),
      },
    });
  }
  return result;
}

export async function copyItemToContainer(
  id: number,
  containerId: number,
  wrappedKey: string
) {
  // - copies existing item, creating it in another container
  // get the existing item (so we can use its name and get its upload id)
  // get the container (to confirm it exists)
  // call createItem, with the new containerId and wrappedKey
  // return the new item
}

export async function moveItem() {}
export async function updateItem() {
  // why update?
  // - rename
  // - new uploadId
}

export async function getContainerInfo(id: number) {
  try {
    return prisma.container.findUniqueOrThrow({
      where: {
        id,
      },
    });
  } catch (err) {
    throw new Error(`Could not find container`);
  }
}

export async function getContainerWithDescendants(id: number) {
  let container;
  try {
    container = await prisma.container.findUniqueOrThrow({
      where: { id },
      include: {
        children: true,
      },
    });
  } catch (err) {
    throw new Error(`Could not find container`);
  }

  if (container.children.length > 0) {
    for (let i = 0; i < container.children.length; i++) {
      const children = await getContainerWithDescendants(
        container.children[i].id
      );
      container.children[i]['children'] = children;
    }
  }

  return container;
}

export async function addGroupMember(containerId: number, userId: number) {
  let container;
  try {
    container = await prisma.container.findUniqueOrThrow({
      where: {
        id: containerId,
      },
      select: {
        group: {
          select: {
            id: true,
          },
        },
      },
    });
  } catch (err) {
    throw new Error(`Could not find container`);
  }

  const { group } = container ?? {};

  if (!group.id) {
    throw new Error(`could not create membership`);
  }

  // Returns `null` if no record found.
  // Do not try/catch.
  const membership = await prisma.membership.findFirst({
    where: {
      groupId: group.id,
      userId,
    },
  });
  if (membership) {
    return membership;
  }

  try {
    return await prisma.membership.create({
      data: {
        groupId: group.id,
        userId,
        permission: PermissionType.READ, // Lowest permissions, by default
      },
    });
  } catch (err) {
    throw new Error(`could not create membership`);
  }
}

export async function removeInvitationAndGroup(invitationId: number) {
  let invitation;
  try {
    invitation = await prisma.invitation.findUniqueOrThrow({
      where: {
        id: invitationId,
      },
      include: {
        share: true,
        recipient: true,
      },
    });
  } catch (err) {
    throw new Error(`Could not find invitation`);
  }

  // remove membership, if any
  try {
    await removeGroupMember(
      invitation.share.containerId,
      invitation.recipient.id
    );
  } catch (err) {
    console.log(err);
    console.log(`Could not remove membership - may not exist`);
    throw new Error(`Could not remove membership`);
  }

  try {
    return await prisma.invitation.delete({
      where: {
        id: invitationId,
      },
    });
  } catch (err) {
    throw new Error(`Could not delete invitation`);
  }
}

export async function removeGroupMember(containerId: number, userId: number) {
  let group;
  try {
    group = await prisma.group.findFirstOrThrow({
      where: {
        container: {
          id: containerId,
        },
      },
    });
  } catch (err) {
    throw new Error(`Could not find group`);
  }

  try {
    return prisma.membership.delete({
      where: {
        groupId_userId: { groupId: group.id, userId },
      },
    });
  } catch (err) {
    throw new Error(`Could not remove membership`);
  }
}

// Create a tag for an item
export async function createTagForItem(
  tagName: string,
  color: string,
  itemId: number
) {
  // trim, but don't normalize the case
  const name = tagName.trim();
  // or should we do a case-insensitive search for an existing tag?

  const items = {
    connect: [{ id: itemId }],
  };

  // create the tag and add the container
  const tag = await prisma.tag.upsert({
    where: {
      name,
    },
    update: {
      items,
    },
    create: {
      name,
      color,
      items,
    },
  });

  return tag;
}

// Create a tag for a container
export async function createTagForContainer(
  tagName: string,
  color: string,
  containerId: number
) {
  // trim, but don't normalize the case
  const name = tagName.trim();
  // or should we do a case-insensitive search for an existing tag?

  const containers = {
    connect: [{ id: containerId }],
  };

  // create the tag and add the container
  const tag = await prisma.tag.upsert({
    where: {
      name,
    },
    update: {
      containers,
    },
    create: {
      name,
      color,
      containers,
    },
  });

  return tag;
}

// Delete a tag
export async function deleteTag(id: number) {
  try {
    return await prisma.tag.delete({
      where: {
        id,
      },
    });
  } catch (err) {
    throw new Error(`Could not delete tag`);
  }
}

// Update/rename a tag
export async function updateTagName(tagId: number, name: string) {
  const result = await prisma.tag.update({
    where: {
      id: tagId,
    },
    data: {
      name,
      // updatedAt: new Date(),
    },
  });
  return result;
}
// Get all items and containers (that I have access to) with a specific tag or tags

export async function getContainersAndItemsWithTags(
  userId: number,
  tagNames: string[]
) {
  // First, find the group memberships for the user.
  const memberships = await prisma.membership.findMany({
    where: { userId },
  });

  // We then transform the memberships to just include the groupId
  const groupIds = memberships.map((membership) => membership.groupId);

  // Now get all containers with these group IDs
  const containersWithTags = await prisma.container.findMany({
    where: {
      group: { id: { in: groupIds } },
      tags: { some: { name: { in: tagNames } } }, // Looking for any of the input tags
    },
    include: {
      items: true, // include related items
      tags: true, // include related tags
    },
  });

  // Fetching items with the tag and any parent container must be made accessible by the groups
  const itemsWithTags = await prisma.item.findMany({
    where: {
      container: {
        group: { id: { in: groupIds } },
      },
      tags: { some: { name: { in: tagNames } } }, // Looking for any of the input tags
    },
    include: {
      container: true, // include related container
      tags: true, // include related tags
    },
  });

  return {
    containers: containersWithTags,
    items: itemsWithTags,
  };
}
