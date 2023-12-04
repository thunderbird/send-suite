import {
  PrismaClient,
  ContainerType,
  ItemType,
  UserTier,
  InvitationStatus,
} from '@prisma/client';
const prisma = new PrismaClient();
import { randomBytes } from 'crypto';
import { base64url } from './utils';

import { PermissionType } from './types/custom';

export async function createUser(
  publicKey: string,
  email: string,
  tier: UserTier = UserTier.PRO
) {
  return prisma.user.create({
    data: {
      publicKey,
      email,
      tier,
    },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
}

export async function getUserPublicKey(id: number) {
  return prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      publicKey: true,
    },
  });
}

export async function createUpload(
  id: string,
  size: number,
  ownerId: number,
  type: string
) {
  const upload = await prisma.upload.create({
    data: {
      id,
      size,
      ownerId,
      createdAt: new Date(),
      type,
    },
  });
  return upload;
}

export async function getUploadSize(id: string) {
  const upload = await prisma.upload.findUnique({
    where: {
      id,
    },
    select: {
      size: true,
    },
  });
  return upload.size;
}

export async function getUploadMetadata(id: string) {
  const upload = await prisma.upload.findUnique({
    where: {
      id,
    },
    select: {
      size: true,
      type: true,
    },
  });
  const { size, type } = upload;
  return { size, type };
}

// Automatically creates a group for container
// owner is added to new group
export async function createContainer(
  name: string,
  // publicKey: string,
  ownerId: number,
  type: ContainerType,
  parentId: number,
  shareOnly: boolean
) {
  // TODO: figure out the nested create syntax:
  // https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#create-1
  const group = await prisma.group.create({
    data: {},
  });

  console.log(`👿 just created group`);
  await prisma.membership.create({
    data: {
      groupId: group.id,
      userId: ownerId,
      permission: PermissionType.ADMIN, // Owner has full permissions
    },
  });
  console.log(`👿 just added owner to group`);

  const createArgs = {
    data: {
      name,
      // publicKey,
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

  const container = await prisma.container.create(createArgs);
  console.log(`👿 just created container, connected to group`);

  return container;
}

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

export async function getContainersSharedByMe(
  userId: number,
  type: ContainerType
) {
  const shares = await prisma.share.findMany({
    where: {
      senderId: userId,
    },
    include: {
      sender: true,
      // Including related containers and members.
      container: {
        include: {
          group: {
            include: {
              members: true,
            },
          },
        },
      },
      // Include who we sent the invitation to.
      invitations: {
        include: {
          recipient: true,
        },
      },
      // Include all accessLinks
      accessLinks: true,
    },
  });

  if (!shares) {
    return [];
  }

  // const containers = shares.filter(
  //   (share) =>
  //     share.container.type === type && share.container.group.members.length > 1
  // );
  // const containers = shares.map((share) => share.container);
  // return containers;
  return shares;
}

export async function getContainersSharedWithMe(
  recipientId: number,
  type: ContainerType
) {
  const invitations = await prisma.invitation.findMany({
    where: {
      recipientId,
      status: InvitationStatus.ACCEPTED,
    },
    select: {
      share: {
        select: {
          sender: {
            select: {
              id: true,
              email: true,
            },
          },
          container: true,
        },
      },
    },
  });
  return invitations.filter((i) => i.share.container.type === type);
}

export async function getSharesForContainer(
  containerId: number,
  userId: number
) {
  return await prisma.share.findMany({
    where: {
      // Removing senderId for now
      // TODO: determine when other users should see/control sharing
      // senderId: userId,
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

export async function updateContainerName(containerId: number, name: string) {
  const result = await prisma.container.update({
    where: {
      id: containerId,
    },
    data: {
      name,
      updatedAt: new Date(),
    },
  });
  return result;
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
  // TODO: confirm that the userId matches the senderId of the share
  // or if the user is the owner of the container

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
  // TODO: confirm that the userId matches the senderId of the share
  // or if the user is the owner of the container
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

export async function __getSharedContainersAndMembers(
  userId: number,
  type: ContainerType
) {
  // Get the containers I can access, but owned by someone else
  const containerWhere = {
    ownerId: {
      not: userId, // Exclude the user's own containers
    },
    type,
  };

  const results = await prisma.membership.findMany({
    where: {
      userId,
    },
    include: {
      group: {
        include: {
          container: {
            where: containerWhere,
          },
          members: {
            select: {
              user: true,
            },
          }, // Include the members of each group
        },
      },
    },
  });

  if (results) {
    // Only include results with non-null containers.
    // Null containers happen because:
    // - the initial query is for GroupUsers
    // - doing an `include` for containers also returns non-owned ones
    // Return container objects whose type matches.
    return results
      .filter((obj) => !!obj.group.container)
      .map((obj) => obj.group.container)
      .filter((container) => container.type === type);
  }
  return results;
}

export async function getContainerWithMembers(containerId: number) {
  return await prisma.container.findUnique({
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
}

export async function createItem(
  name: string,
  containerId: number,
  uploadId: string,
  type: ItemType,
  wrappedKey: string
) {
  const item = await prisma.item.create({
    data: {
      createdAt: new Date(),
      updatedAt: new Date(),
      name,
      wrappedKey,
      // containerId,
      // uploadId,
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
  if (item) {
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
  return item;
}

export async function deleteItem(id: number, shouldDeleteUpload = false) {
  // TODO: manage user sessions on the server
  // requiring logged-in user to be owner

  let containerId;
  if (shouldDeleteUpload) {
    const item = await prisma.item.findUnique({
      where: {
        id,
      },
      select: {
        containerId: true,
        uploadId: true,
      },
    });
    containerId = item.containerId;
    const uploadDeleteResult = await prisma.upload.delete({
      where: {
        id: item.uploadId,
      },
    });
    if (!uploadDeleteResult) {
      console.log(`We should delete the upload, but could not`);
      return null;
    }
    console.log(`deleted upload ${item.uploadId}`);
  }

  const result = await prisma.item.delete({
    where: {
      id,
    },
  });

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

  console.log(`deleted item ${id}`);
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
  return prisma.container.findUnique({
    where: {
      id,
    },
  });
}

export async function getContainerWithAncestors(id: number) {
  const container = await prisma.container.findUnique({
    where: {
      id,
    },
  });
  if (container.parentId) {
    container['parent'] = await getContainerWithAncestors(container.parentId);
  }
  return container;
}

export async function getItemsInContainer(id: number) {
  return prisma.container.findUnique({
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
    // include: {
    //   items: true,
    // },
  });
}

async function _whereContainer(
  userId: number,
  type: ContainerType | null,
  shareOnly?: boolean,
  topLevelOnly?: boolean
) {
  const params = {
    where: {
      id: userId,
    },
    select: {
      id: true,
      groups: {
        select: {
          groupId: true,
        },
      },
    },
  };
  const user = await prisma.user.findUnique(params);
  if (!user) {
    return null;
  }
  const groupIds = user.groups.map(({ groupId }) => groupId);
  const containerWhere = {
    groupId: {
      in: groupIds,
    },
  };

  if (type) {
    containerWhere['type'] = type;
  }

  if (shareOnly !== undefined) {
    containerWhere['shareOnly'] = shareOnly;
  }

  // top-level containers have a null parentId
  if (topLevelOnly !== undefined) {
    containerWhere['parentId'] = null;
  }

  return containerWhere;
}

// TODO:
// - move item to another container
// - delete item

// Does not include shareOnly containers.
export async function getAllUserGroupContainers(
  userId: number,
  type: ContainerType | null
) {
  const containerWhere = await _whereContainer(userId, type, false, true);
  return prisma.container.findMany({
    where: containerWhere,
    // include: {
    //   items: true,
    // },
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
          id: true,
          name: true,
          wrappedKey: true,
          uploadId: true,
          containerId: true,
          // uploadId: true,
          // createdAt: true,
          type: true,
          upload: {
            select: {
              // type: true,
              size: true,
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
  });
}

export async function getRecentActivity(
  userId: number,
  type: ContainerType | null
) {
  // Get all containers
  const containerWhere = await _whereContainer(userId, type);
  const containers = await prisma.container.findMany({
    take: 10,
    where: containerWhere,
    orderBy: [
      {
        updatedAt: 'desc',
      },
      {
        name: 'asc',
      },
    ],
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      type: true,
      shareOnly: true,
      items: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  return containers;
}

// for a container, how many groups are there?
// should there be only one?
export async function addGroupMember(containerId: number, userId: number) {
  const container = await prisma.container.findUnique({
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

  if (!container) {
    return null;
  }

  const { group } = container ?? {};

  if (!group) {
    return null;
  }

  return prisma.membership.create({
    data: {
      groupId: group.id,
      userId,
      permission: PermissionType.READ, // Lowest permissions, by default
    },
  });
}

export async function createInvitation(
  containerId: number,
  wrappedKey: string,
  senderId: number,
  recipientId: number,
  permission: number
) {
  console.log(`Looking for existing share`);
  let share = await prisma.share.findFirst({
    where: {
      containerId,
      senderId,
    },
  });

  if (!share) {
    console.log(`getting user with id ${senderId}`);
    const user = await prisma.user.findUnique({
      where: {
        id: senderId,
      },
    });

    console.log(`No existing share. Let's create one.`);
    // Create a share
    share = await prisma.share.create({
      data: {
        containerId,
        senderId: user.id,
      },
    });
  }

  if (!share) {
    console.log(`Could not create share before creating invitation.`);
    return null;
  }
  console.log(`Creating invitation`);

  return prisma.invitation.create({
    data: {
      share: {
        connect: {
          id: share.id,
        },
      },
      wrappedKey,
      recipient: {
        connect: {
          id: recipientId,
        },
      },
      permission,
    },
  });
}

export async function getAllInvitations(userId: number) {
  const invitations = await prisma.invitation.findMany({
    where: {
      recipientId: userId,
      status: InvitationStatus.PENDING,
    },
    include: {
      share: {
        include: {
          sender: true,
          container: true,
        },
      },
    },
  });
  return invitations;
}

export async function acceptInvitation(invitationId: number) {
  console.log(`accepting invitation for ${invitationId}`);
  // get invitation from database
  const invitation = await prisma.invitation.findUnique({
    where: {
      id: invitationId,
    },
  });
  if (!invitation) {
    return null;
  }

  // get the recipientId from invitation
  // get container from the invitation
  const { recipientId, shareId } = invitation;
  console.log(
    `got share id ${shareId} from invitation, getting containerId from share`
  );

  const share = await prisma.share.findUnique({
    where: {
      id: shareId,
    },
  });

  if (!share) {
    console.log(`Cannot accept invitation - Share does not exist.`);
    return null;
  }

  const { containerId } = share;
  console.log(
    `creating membership to container ${containerId} for user ${recipientId}`
  );
  // create a new groupUser for recipientId and group
  const groupUser = await addGroupMember(containerId, recipientId);

  // Mark the invitation as accepted
  const result = await prisma.invitation.update({
    where: {
      id: invitationId,
    },
    data: {
      status: InvitationStatus.ACCEPTED,
    },
  });

  if (!result) {
    return null;
  }

  return {
    success: 'did not delete because we are not ready yet',
  };
}

export async function removeInvitationAndGroup(invitationId: number) {
  const invitation = await prisma.invitation.findUnique({
    where: {
      id: invitationId,
    },
    include: {
      share: true,
      recipient: true,
    },
  });
  if (!invitation) {
    return null;
  }

  // remove membership, if any
  try {
    await removeGroupMember(
      invitation.share.containerId,
      invitation.recipient.id
    );
  } catch (e) {
    console.log(e);
    console.log(`Could not remove membership - may not exist`);
  }

  const result = await prisma.invitation.delete({
    where: {
      id: invitationId,
    },
  });

  return result;
}

export async function removeGroupMember(containerId: number, userId: number) {
  // TODO: write a better, more correct version of this.
  // This code works off of the assumption that there
  // is a one-to-one correspondence between groups and containers.
  // This seems to be true, but it isn't guaranteed.
  const group = await prisma.group.findFirst({
    where: {
      container: {
        id: containerId,
      },
    },
  });

  return prisma.membership.delete({
    where: {
      groupId_userId: { groupId: group.id, userId },
    },
  });
}

export async function createAccessLink(
  containerId: number,
  senderId: number,
  wrappedKey: string,
  salt: string,
  challengeKey: string,
  challengeSalt: string,
  challengeCiphertext: string,
  challengePlaintext: string,
  permission: number,
  expiration?: string
) {
  let share = await prisma.share.findFirst({
    where: {
      containerId,
      senderId,
    },
  });

  if (!share) {
    // Create a share
    share = await prisma.share.create({
      data: {
        containerId,
        senderId,
      },
    });
  }

  if (!share) {
    console.log(`Could not create share before creating accessLink.`);
    return null;
  }

  console.log(`Created share for access link: ${share.id}`);
  const id = base64url(randomBytes(64));

  console.log(`🚀 I see an expiration of: ${expiration}`);
  let expiryDate = null;
  if (expiration) {
    expiryDate = new Date(expiration);
  }

  console.log(`🚀 using expiryDate`);
  console.log(expiryDate);

  return prisma.accessLink.create({
    data: {
      id,
      share: {
        connect: {
          id: share.id,
        },
      },
      wrappedKey,
      salt,
      challengeKey,
      challengeSalt,
      challengeCiphertext,
      challengePlaintext,
      permission,
      expiryDate,
    },
  });
}

export async function getAccessLinkChallenge(linkId: string) {
  return prisma.accessLink.findUnique({
    where: {
      id: linkId,
    },
    select: {
      challengeKey: true,
      challengeSalt: true,
      challengeCiphertext: true,
    },
  });
}

export async function acceptAccessLink(
  linkId: string,
  challengePlaintext: string
) {
  try {
    // find the accessLink in the database
    // for the linkId, does the challenge match
    // what's in the database?
    const accessLink = await prisma.accessLink.findUnique({
      where: {
        id: linkId,
        challengePlaintext,
      },
      include: {
        share: {
          select: {
            containerId: true,
          },
        },
      },
    });
    return accessLink;
  } catch (e) {
    console.log(`👿😿`);
    console.log(e);
    return null;
  }
}

export async function getContainerForAccessLink(linkId: string) {
  return await prisma.accessLink.findUnique({
    where: {
      id: linkId,
    },
    select: {
      share: {
        select: {
          container: {
            include: {
              items: {
                include: {
                  upload: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function createInvitationForAccessLink(
  linkId: string,
  recipientId: number
) {
  const accessLink = await prisma.accessLink.findUnique({
    where: {
      id: linkId,
    },
    select: {
      wrappedKey: true,
      permission: true,
      share: {
        select: {
          senderId: true,
          containerId: true,
        },
      },
    },
  });
  console.log(accessLink);

  // NOTE: we're just copying over the password-wrapped key
  // we *are not* wrapping the key with the user's publicKey
  // that's what's supposed to be in that field
  const invitation = await createInvitation(
    accessLink.share.containerId,
    accessLink.wrappedKey,
    accessLink.share.senderId,
    recipientId,
    accessLink.permission
  );
  const result = await prisma.invitation.update({
    where: {
      id: invitation.id,
    },
    data: {
      status: InvitationStatus.ACCEPTED,
    },
  });

  return result;
}

export async function isAccessLinkValid(linkId: string) {
  const now = new Date();
  const results = await prisma.accessLink.findMany({
    where: {
      AND: [
        { id: { equals: linkId } },
        {
          OR: [{ expiryDate: { gt: now } }, { expiryDate: null }],
        },
      ],
    },
    select: {
      id: true,
    },
  });

  return results.length > 0 ? results[0] : null;
}

export async function removeAccessLink(linkId: string) {
  return prisma.accessLink.delete({
    where: {
      id: linkId,
    },
  });
}

export async function burnEphemeralConversation(containerId: number) {
  return await burnFolder(containerId);
}

export async function burnFolder(
  containerId: number,
  shouldDeleteUpload?: boolean
) {
  // delete the ephemeral link
  console.log(`🤡 burning container id: ${containerId}`);
  const shares = await prisma.share.findMany({
    where: {
      containerId,
    },
  });

  // For each share, delete corresponding access links
  for (const share of shares) {
    await prisma.accessLink.deleteMany({
      where: {
        shareId: share.id,
      },
    });
  }

  console.log(`✅ deleted ephemeral links`);
  // links.forEach(({ id }) => {
  //   console.log(`✅ link id: ${id}`);
  // });
  // console.log(links);

  // get the container so we can get the
  // - groups (so we can get users)
  // - items (so we can get uploads)
  const container = await prisma.container.findUnique({
    where: {
      id: containerId,
    },
    select: {
      group: {
        select: {
          id: true,
          members: {
            select: {
              user: {
                select: {
                  id: true,
                  tier: true,
                },
              },
            },
          },
        },
      },
      items: {
        select: {
          id: true,
          uploadId: true,
        },
      },
    },
  });

  const users = container.group.members.map(({ user }) => user);

  console.log(`🤡 deleting items and uploads`);
  const uploadIds = container.items.map((item) => item.uploadId);
  await Promise.all(
    container.items.map(async ({ id }) => {
      console.log(`✅ deleting item ${id}`);
      return prisma.item.delete({
        where: {
          id,
        },
      });
    })
  );

  if (shouldDeleteUpload) {
    await Promise.all(
      uploadIds.map(async (id) => {
        console.log(`✅ deleting upload ${id}`);
        return prisma.upload.delete({
          where: {
            id,
          },
        });
      })
    );
  }

  const deleteResp = await prisma.container.delete({
    where: {
      id: containerId,
    },
  });
  if (!deleteResp) {
    console.log(`👿👿👿👿 oh noes.`);
    return null;
  }
  console.log(`✅ deleting container ${containerId}`);
  await Promise.all(
    users.map(async ({ id, tier }) => {
      return await prisma.membership.deleteMany({
        where: {
          groupId: container.group.id,
          // don't specify the user id
          // remove all groupUser records for this group
          // userId: id,
        },
      });
      console.log(
        `✅ deleted groupUser relations for group ${container.group.id}`
      );
    })
  );

  // must do *after* deleting groupUser
  await Promise.all(
    users
      .filter((user) => user.tier === UserTier.EPHEMERAL)
      .map(async ({ id, tier }) => {
        await prisma.user.delete({
          where: {
            id,
          },
        });
        console.log(`✅ deleted ephemeral user ${id}`);
      })
  );

  await prisma.group.delete({
    where: {
      id: container.group.id,
    },
  });
  console.log(`✅ deleted group user ${container.group.id}`);

  // Basically, if we got this far, everything was burned successfully.
  // TODO: add some sort of retry mechanism.
  return deleteResp;
}

// Create a tag for an item
export async function createTagForItem(tagName: string, itemId: number) {
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
      items,
    },
  });

  return tag;
}

// Create a tag for a container
export async function createTagForContainer(
  tagName: string,
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
      containers,
    },
  });

  return tag;
}

// Delete a tag
export async function deleteTag(id: number) {
  const result = await prisma.tag.delete({
    where: {
      id,
    },
  });

  return result;
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
