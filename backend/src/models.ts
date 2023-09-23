import {
  PrismaClient,
  ContainerType,
  ItemType,
  UserTier,
} from '@prisma/client';
const prisma = new PrismaClient();
import { randomBytes } from 'crypto';
import { base64url } from './utils';

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
  type: ContainerType
) {
  // TODO: figure out the nested create syntax:
  // https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#create-1
  const group = await prisma.group.create({
    data: {},
  });

  console.log(`👿 just created group`);
  await prisma.groupUser.create({
    data: {
      groupId: group.id,
      userId: ownerId,
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

// required: containerId
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
  const where = {
    groupId: {
      in: groupIds,
    },
  };

  if (type) {
    where['type'] = type;
  }

  return prisma.container.findMany({
    where,
    // include: {
    //   items: true,
    // },
    select: {
      id: true,
      name: true,
      items: {
        select: {
          name: true,
          wrappedKey: true,
          uploadId: true,
          // uploadId: true,
          // createdAt: true,
          // type: true,
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

  return prisma.groupUser.create({
    data: {
      groupId: group.id,
      userId,
    },
  });
}

export async function createInvitation(
  containerId: number,
  wrappedKey: string,
  userId: number,
  senderId: number
) {
  return prisma.invitation.create({
    data: {
      containerId,
      wrappedKey,
      sender: {
        connect: {
          id: senderId,
        },
      },
      recipient: {
        connect: {
          id: userId,
        },
      },
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
  const { recipientId, containerId } = invitation;
  console.log(
    `creating membership to container ${containerId} for user ${recipientId} `
  );
  // create a new groupUser for recipientId and group
  const groupUser = await addGroupMember(containerId, recipientId);

  // delete the invitation
  const result = await prisma.invitation.delete({
    where: {
      id: invitationId,
    },
  });

  if (!result) {
    return null;
  }

  return {
    success: 'did not delete because we are not ready yet',
  };
}

export async function removeGroupMember(groupId: number, userId: number) {
  return prisma.groupUser.delete({
    where: {
      groupId_userId: { groupId, userId },
    },
  });
}

export async function createEphemeralLink(
  containerId: number,
  wrappedKey: string,
  salt: string,
  challengeKey: string,
  challengeSalt: string,
  senderId: number,
  challengeCiphertext: string,
  challengePlaintext: string
) {
  const id = base64url(randomBytes(64));
  return prisma.ephemeralLink.create({
    data: {
      id,
      containerId,
      wrappedKey,
      salt,
      challengeKey,
      challengeSalt,
      sender: {
        connect: {
          id: senderId,
        },
      },
      challengeCiphertext,
      challengePlaintext,
    },
  });
}

export async function getEphemeralLinkChallenge(hash: string) {
  return prisma.ephemeralLink.findUnique({
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

export async function acceptEphemeralLink(
  hash: string,
  challengePlaintext: string
) {
  try {
    // find the ephemeralLink in the database
    // for the hash, does the challenge match
    // what's in the database?
    const ephemeralLink = await prisma.ephemeralLink.findUnique({
      where: {
        id: hash,
        challengePlaintext,
      },
    });
    console.log(`challenge text matches, continuing 🚀🚀`);
    console.log(`here is where we should create the user, etc.`);
    return ephemeralLink;
  } catch (e) {
    console.log(`👿😿`);
    console.log(e);
    return null;
  }
}

export async function burnEphemeralConversation(containerId: number) {
  // delete the ephemeral link
  console.log(`🤡 burning container id: ${containerId}`);
  const links = await prisma.ephemeralLink.deleteMany({
    where: {
      containerId,
    },
    // select: {
    //   id: true,
    // },
  });
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
      return await prisma.groupUser.deleteMany({
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
