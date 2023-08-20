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
  tier = UserTier.PRO
) {
  return prisma.user.create({
    data: {
      publicKey,
      email,
      tier,
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

export async function createUpload(id: string, size: number, ownerId: number) {
  const upload = await prisma.upload.create({
    data: {
      id,
      size,
      ownerId,
      createdAt: new Date(),
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
  type: ItemType
) {
  return prisma.item.create({
    data: {
      createdAt: new Date(),
      name,
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
          uploadId: true,
          createdAt: true,
          upload: {
            select: {
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
    include: {
      items: true,
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
  senderId: number,
  salt: string,
  challengeCiphertext: string,
  challengePlaintext: string
) {
  const id = base64url(randomBytes(64));
  return prisma.ephemeralLink.create({
    data: {
      id,
      containerId,
      wrappedKey,
      sender: {
        connect: {
          id: senderId,
        },
      },
      salt,
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
      salt: true,
      challengeCiphertext: true,
      wrappedKey: true,
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
