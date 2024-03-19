import {
  PrismaClient,
  ContainerType,
  ItemType,
  InvitationStatus,
  Item,
  Membership,
} from '@prisma/client';
const prisma = new PrismaClient();
import { fromPrisma } from './models/prisma-helper';

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
  const query = {
    where: {
      ownerId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  };
  return await fromPrisma(prisma.container.findMany, query);
}

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
  const onError = () => {
    throw new Error(`Could not update item`);
  };
  return await fromPrisma(prisma.item.update, query, onError);
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
  const onError = () => {
    throw new Error(`Could not update invitation`);
  };
  return await fromPrisma(prisma.invitation.update, query, onError);
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
  const onError = () => {
    throw new Error(`Could not update access link`);
  };
  return await fromPrisma(prisma.accessLink.update, query, onError);
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
  const onError = () => {
    throw new Error(`could not find container`);
  };
  return await fromPrisma(prisma.container.findUniqueOrThrow, query, onError);
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
  const onError = () => {
    throw new Error(`could not create item`);
  };

  return await fromPrisma(prisma.item.create, query, onError);
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
  const onItemFindError = () => {
    throw new Error(`Could not find item`);
  };
  const item = await fromPrisma(
    prisma.item.findUniqueOrThrow,
    findItemQuery,
    onItemFindError
  );
  const containerId = item.containerId;

  if (shouldDeleteUpload) {
    const uploadDeleteQuery = {
      where: {
        id: item.uploadId,
      },
    };
    const onUploadDeleteError = () => {
      throw new Error(`Could not delete upload`);
    };
    await fromPrisma(
      prisma.upload.delete,
      uploadDeleteQuery,
      onUploadDeleteError
    );
  }

  const itemDeleteQuery = {
    where: {
      id,
    },
  };
  const onItemDeleteError = () => {
    throw new Error(`Could not delete item`);
  };
  const result = await fromPrisma(
    prisma.item.delete,
    itemDeleteQuery,
    onItemDeleteError
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
    const onUpdateContainerError = () => {
      throw new Error(`Could not update container`);
    };
    await fromPrisma(
      prisma.container.update,
      updateContainerQuery,
      onUpdateContainerError
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
  const onError = () => {
    throw new Error(`Could not find container`);
  };
  return await fromPrisma(prisma.container.findUniqueOrThrow, query, onError);
}

export async function getContainerWithDescendants(id: number) {
  const query = {
    where: { id },
    include: {
      children: true,
    },
  };
  const onError = () => {
    throw new Error(`Could not find container`);
  };
  const container = await fromPrisma(
    prisma.container.findUniqueOrThrow,
    query,
    onError
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
  const onFindContainerError = () => {
    throw new Error(`Could not find container`);
  };
  const container = await fromPrisma(
    prisma.container.findUniqueOrThrow,
    findContainerQuery,
    onFindContainerError
  );

  const { group } = container ?? {};
  if (!group.id) {
    throw new Error(`could not create membership`);
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
  const onCreateMembershipError = () => {
    throw new Error(`could not create membership`);
  };
  return await fromPrisma(
    prisma.membership.create,
    createMembershipQuery,
    onCreateMembershipError
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
  const onFindInvitationError = () => {
    throw new Error(`Could not find invitation`);
  };
  const invitation = await fromPrisma(
    prisma.invitation.findUniqueOrThrow,
    findInvitationQuery,
    onFindInvitationError
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
  const onDeleteInvitationError = () => {
    throw new Error(`Could not delete invitation`);
  };
  return await fromPrisma(
    prisma.invitation.delete,
    deleteInvitationQuery,
    onDeleteInvitationError
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
  const onFindGroupError = () => {
    throw new Error(`Could not find group`);
  };
  const group = await fromPrisma(
    prisma.group.findFirstOrThrow,
    findGroupQuery,
    onFindGroupError
  );

  const deleteMembershipQuery = {
    where: {
      groupId_userId: { groupId: group.id, userId },
    },
  };
  const onDeleteMembershipError = () => {
    throw new Error(`Could not remove membership`);
  };
  return await fromPrisma(
    prisma.membership.delete,
    deleteMembershipQuery,
    onDeleteMembershipError
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
  const onError = () => {
    throw new Error(`Could not upsert tag`);
  };

  return await fromPrisma(prisma.tag.upsert, query, onError);
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
  const onError = () => {
    throw new Error(`Could not upsert tag`);
  };

  return await fromPrisma(prisma.tag.upsert, query, onError);
}

// Delete a tag
export async function deleteTag(id: number) {
  const query = {
    where: {
      id,
    },
  };
  const onError = () => {
    throw new Error(`Could not delete tag`);
  };
  return await fromPrisma(prisma.tag.delete, query, onError);
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
  const onError = () => {
    throw new Error(`Could not update tag`);
  };
  return await fromPrisma(prisma.tag.update, query, onError);
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
