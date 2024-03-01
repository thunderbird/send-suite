import {
  PrismaClient,
  UserTier,
  InvitationStatus,
  ContainerType,
} from '@prisma/client';
const prisma = new PrismaClient();
import { randomBytes } from 'crypto';
import { base64url } from '../utils';

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

  console.log(`Checking for existing invitation`);
  const invitation = await prisma.invitation.findFirst({
    where: {
      shareId: share.id,
      recipientId,
    },
  });
  if (invitation) {
    console.log(`invitation found. no need to create duplicate`);
    return invitation;
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
  // that's what's supposed to be in that field.
  // TODO: figure out whether this is important.
  // Invitations normally have a publicKey wrapped key.
  // But this is just for record keeping.
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

export async function burnEphemeralConversation(containerId: number) {
  return await burnFolder(containerId);
}
