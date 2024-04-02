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
import { fromPrisma } from './models/prisma-helper';
import {
  BaseError,
  CONTAINER_NOT_UPDATED,
  CONTAINER_NOT_FOUND,
  CONTAINER_NOT_CREATED,
  MEMBERSHIP_NOT_CREATED,
  GROUP_NOT_CREATED,
  ITEM_NOT_CREATED,
  ITEM_NOT_DELETED,
  ITEM_NOT_UPDATED,
  INVITATION_NOT_FOUND,
  INVITATION_NOT_DELETED,
  UPLOAD_NOT_DELETED,
  ITEM_NOT_FOUND,
  GROUP_NOT_FOUND,
  MEMBERSHIP_NOT_DELETED,
  INVITATION_NOT_UPDATED,
  ACCESSLINK_NOT_UPDATED,
  TAG_NOT_CREATED,
  TAG_NOT_DELETED,
  TAG_NOT_UPDATED,
} from './errors/models';

export async function getSharesForContainer(
  containerId: number,
  userId: number
) {
  const query = {
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
  };
  return await fromPrisma(prisma.share.findMany, query);
}

export async function updateItemName(itemId: number, name: string) {
  const query = {
    where: {
      id: itemId,
    },
    data: {
      name,
      updatedAt: new Date(),
    },
  };

  return await fromPrisma(prisma.item.update, query, ITEM_NOT_UPDATED);
}

export async function updateInvitationPermissions(
  containerId: number,
  invitationId: number,
  userId: number,
  permission: PermissionType
) {
  const query = {
    where: {
      id: invitationId,
    },
    data: {
      permission,
    },
  };

  return await fromPrisma(
    prisma.invitation.update,
    query,
    INVITATION_NOT_UPDATED
  );
}

export async function updateAccessLinkPermissions(
  containerId: number,
  accessLinkId: string,
  userId: number,
  permission: PermissionType
) {
  const query = {
    where: {
      id: accessLinkId,
    },
    data: {
      permission,
    },
  };

  return await fromPrisma(
    prisma.accessLink.update,
    query,
    ACCESSLINK_NOT_UPDATED
  );
}

export async function getContainerWithMembers(containerId: number) {
  const query = {
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
  };

  return await fromPrisma(
    prisma.container.findUniqueOrThrow,
    query,
    CONTAINER_NOT_FOUND
  );
}

export async function createItem(
  name: string,
  containerId: number,
  uploadId: string,
  type: ItemType,
  wrappedKey: string
) {
  const query = {
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
  };

  return await fromPrisma(prisma.item.create, query, ITEM_NOT_CREATED);
}

export async function deleteItem(id: number, shouldDeleteUpload = false) {
  const findItemQuery = {
    where: {
      id,
    },
    select: {
      containerId: true,
      uploadId: true,
    },
  };

  const item = await fromPrisma(
    prisma.item.findUniqueOrThrow,
    findItemQuery,
    ITEM_NOT_FOUND
  );
  const containerId = item.containerId;

  if (shouldDeleteUpload) {
    const uploadDeleteQuery = {
      where: {
        id: item.uploadId,
      },
    };

    await fromPrisma(
      prisma.upload.delete,
      uploadDeleteQuery,
      UPLOAD_NOT_DELETED
    );
  }

  const itemDeleteQuery = {
    where: {
      id,
    },
  };

  const result = await fromPrisma(
    prisma.item.delete,
    itemDeleteQuery,
    ITEM_NOT_DELETED
  );

  if (containerId && result) {
    // touch the container's `updatedAt` date
    const updateContainerQuery = {
      where: {
        id: containerId,
      },
      data: {
        updatedAt: new Date(),
      },
    };

    await fromPrisma(
      prisma.container.update,
      updateContainerQuery,
      CONTAINER_NOT_UPDATED
    );
  }

  return result;
}

export async function getContainerInfo(id: number) {
  const query = {
    where: {
      id,
    },
  };
  return await fromPrisma(
    prisma.container.findUniqueOrThrow,
    query,
    CONTAINER_NOT_FOUND
  );
}

export async function getContainerWithDescendants(id: number) {
  const query = {
    where: { id },
    include: {
      children: true,
    },
  };

  const container = await fromPrisma(
    prisma.container.findUniqueOrThrow,
    query,
    CONTAINER_NOT_FOUND
  );

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
  const findContainerQuery = {
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
  };

  const container = await fromPrisma(
    prisma.container.findUniqueOrThrow,
    findContainerQuery,
    CONTAINER_NOT_FOUND
  );

  const { group } = container ?? {};
  if (!group.id) {
    throw new BaseError(MEMBERSHIP_NOT_CREATED);
  }

  // Returns `null` if no record found.
  // Do not try/catch.
  const findMembershipQuery = {
    where: {
      groupId: group.id,
      userId,
    },
  };
  const membership = await fromPrisma(
    prisma.membership.findFirst,
    findMembershipQuery
  );
  if (membership) {
    return membership;
  }

  const createMembershipQuery = {
    data: {
      groupId: group.id,
      userId,
      permission: PermissionType.READ, // Lowest permissions, by default
    },
  };

  return await fromPrisma(
    prisma.membership.create,
    createMembershipQuery,
    MEMBERSHIP_NOT_CREATED
  );
}

export async function removeInvitationAndGroup(invitationId: number) {
  const findInvitationQuery = {
    where: {
      id: invitationId,
    },
    include: {
      share: true,
      recipient: true,
    },
  };

  const invitation = await fromPrisma(
    prisma.invitation.findUniqueOrThrow,
    findInvitationQuery,
    INVITATION_NOT_FOUND
  );

  // remove membership, if any
  await removeGroupMember(
    invitation.share.containerId,
    invitation.recipient.id
  );

  const deleteInvitationQuery = {
    where: {
      id: invitationId,
    },
  };

  return await fromPrisma(
    prisma.invitation.delete,
    deleteInvitationQuery,
    INVITATION_NOT_DELETED
  );
}

export async function removeGroupMember(containerId: number, userId: number) {
  const findGroupQuery = {
    where: {
      container: {
        id: containerId,
      },
    },
  };

  const group = await fromPrisma(
    prisma.group.findFirstOrThrow,
    findGroupQuery,
    GROUP_NOT_FOUND
  );

  const deleteMembershipQuery = {
    where: {
      groupId_userId: { groupId: group.id, userId },
    },
  };

  return await fromPrisma(
    prisma.membership.delete,
    deleteMembershipQuery,
    MEMBERSHIP_NOT_DELETED
  );
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
  const query = {
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
  };

  return await fromPrisma(prisma.tag.upsert, query, TAG_NOT_CREATED);
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

  const query = {
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
  };

  return await fromPrisma(prisma.tag.upsert, query, TAG_NOT_CREATED);
}

// Delete a tag
export async function deleteTag(id: number) {
  const query = {
    where: {
      id,
    },
  };

  return await fromPrisma(prisma.tag.delete, query, TAG_NOT_DELETED);
}

// Update/rename a tag
export async function updateTagName(tagId: number, name: string) {
  const query = {
    where: {
      id: tagId,
    },
    data: {
      name,
      // updatedAt: new Date(),
    },
  };

  return await fromPrisma(prisma.tag.update, query, TAG_NOT_UPDATED);
}
// Get all items and containers (that I have access to) with a specific tag or tags

export async function getContainersAndItemsWithTags(
  userId: number,
  tagNames: string[]
) {
  // First, find the group memberships for the user.
  const findMembershipQuery = {
    where: { userId },
  };
  const memberships = await fromPrisma(
    prisma.membership.findMany,
    findMembershipQuery
  );

  // We then transform the memberships to just include the groupId
  const groupIds = memberships.map((membership) => membership.groupId);

  // Now get all containers with these group IDs
  const findContainersQuery = {
    where: {
      group: { id: { in: groupIds } },
      tags: { some: { name: { in: tagNames } } }, // Looking for any of the input tags
    },
    include: {
      items: true, // include related items
      tags: true, // include related tags
    },
  };
  const containersWithTags = await fromPrisma(
    prisma.container.findMany,
    findContainersQuery
  );

  // Fetching items with the tag and any parent container must be made accessible by the groups
  const findItemsQuery = {
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
  };
  const itemsWithTags = await fromPrisma(prisma.item.findMany, findItemsQuery);

  return {
    containers: containersWithTags,
    items: itemsWithTags,
  };
}
