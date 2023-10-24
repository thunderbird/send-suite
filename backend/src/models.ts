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

  const container = await prisma.container.create({
    data: {
      name,
      // publicKey,
      ownerId,
      groupId: group.id,
      type,
      shareOnly,
    },
  });
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
  ownerId: number,
  type: ContainerType
) {
  throw Error('finish writing this');
  // Need to figure out where I'm the recipient
  const shares = await prisma.share.findMany({
    where: {
      senderId: ownerId,
    },
  });
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
  return prisma.item.create({
    data: {
      createdAt: new Date(),
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
}

export async function deleteItem(id: number, shouldDeleteUpload = false) {
  // TODO: manage user sessions on the server
  // requiring logged-in user to be owner
  if (shouldDeleteUpload) {
    const item = await prisma.item.findUnique({
      where: {
        id,
      },
      select: {
        uploadId: true,
      },
    });
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

export async function getItemsInContainer(id: number) {
  return prisma.container.findUnique({
    where: {
      id,
    },
    select: {
      type: true,
      items: {
        select: {
          name: true,
          wrappedKey: true,
          uploadId: true,
          createdAt: true,
          type: true,
          upload: {
            select: {
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

// TODO:
// - move item to another container
// - delete item

export async function getAllUserGroupContainers(
  userId: number,
  type: ContainerType | null
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
    shareOnly: false,
  };

  if (type) {
    containerWhere['type'] = type;
  }

  return prisma.container.findMany({
    where: containerWhere,
    // include: {
    //   items: true,
    // },
    select: {
      id: true,
      name: true,
      items: {
        select: {
          id: true,
          name: true,
          wrappedKey: true,
          uploadId: true,
          // uploadId: true,
          // createdAt: true,
          type: true,
          upload: {
            select: {
              // type: true,
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
  permission: number
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
    },
  });
}

export async function getAccessLinkChallenge(hash: string) {
  return prisma.accessLink.findUnique({
    where: {
      id: hash,
    },
    select: {
      challengeKey: true,
      challengeSalt: true,
      challengeCiphertext: true,
    },
  });
}

export async function acceptAccessLink(
  hash: string,
  challengePlaintext: string
) {
  try {
    // find the accessLink in the database
    // for the hash, does the challenge match
    // what's in the database?
    const accessLink = await prisma.accessLink.findUnique({
      where: {
        id: hash,
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

export async function getContainerForAccessLinkHash(hash: string) {
  return await prisma.accessLink.findUnique({
    where: {
      id: hash,
    },
    select: {
      share: {
        select: {
          container: {
            include: {
              items: true,
            },
          },
        },
      },
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
