import {
  PrismaClient,
  UserTier,
  InvitationStatus,
  ContainerType,
} from '@prisma/client';
const prisma = new PrismaClient();
import { randomBytes } from 'crypto';
import { base64url } from '../utils';
import { addGroupMember } from '../models';

/**
 * Create Access Link
 * Creates an access link for a container.
 * Looks for an existing share (which connects access links to containers).
 * If one is not found, a new share is created.
 * Function will throw an error if unable to create the new share or the access link.
 */
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

  // For placeholder error message:
  // if there's an error while creating, what couldn't we create?
  let entityName: string;
  try {
    if (!share) {
      // Create a share
      entityName = 'share';
      share = await prisma.share.create({
        data: {
          containerId,
          senderId,
        },
      });
    }

    if (!share) {
      console.log(`Could not create share before creating accessLink.`);
      throw new Error(`could not create ${entityName}`);
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
    entityName = 'access link';
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
  } catch (err) {
    throw new Error(`could not create ${entityName}`);
  }
}

export async function getAccessLinkChallenge(linkId: string) {
  try {
    return prisma.accessLink.findUniqueOrThrow({
      where: {
        id: linkId,
      },
      select: {
        challengeKey: true,
        challengeSalt: true,
        challengeCiphertext: true,
      },
    });
  } catch (err) {
    throw new Error(`Could not find access link`);
  }
}

export async function acceptAccessLink(
  linkId: string,
  challengePlaintext: string
) {
  try {
    // find the accessLink in the database
    // for the linkId, does the challenge match
    // what's in the database?
    const accessLink = await prisma.accessLink.findUniqueOrThrow({
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
    throw new Error(`Could not find access link`);
  }
}

export async function getContainerForAccessLink(linkId: string) {
  try {
    return await prisma.accessLink.findUniqueOrThrow({
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
  } catch (err) {
    throw new Error(`Could not find access link`);
  }
}

export async function createInvitation(
  containerId: number,
  wrappedKey: string,
  senderId: number,
  recipientId: number,
  permission: number
) {
  console.log(`Looking for existing share`);
  // Do not wrap with try/catch.
  // We'll create a share if one isn't found.
  let share = await prisma.share.findFirst({
    where: {
      containerId,
      senderId,
    },
  });
  // For placeholder error message:
  // if there's an error while creating, what couldn't we create?
  let entityName: string;
  try {
    if (!share) {
      console.log(`No existing share. Let's create one.`);
      entityName = 'share';
      share = await prisma.share.create({
        data: {
          containerId,
          senderId,
        },
      });
    }

    if (!share) {
      console.log(`Could not create share before creating invitation.`);
      throw new Error(`could not create ${entityName}`);
    }

    console.log(`Checking for existing invitation`);
    // Do not wrap with try/catch.
    // We'll create a share if one isn't found.
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
    entityName = 'invitation';
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
  } catch (err) {
    throw new Error(`could not create ${entityName}`);
  }
}

export async function createInvitationFromAccessLink(
  linkId: string,
  recipientId: number
) {
  let accessLink;

  try {
    accessLink = await prisma.accessLink.findUniqueOrThrow({
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
  } catch (err) {
    throw new Error(`Could not find access link`);
  }

  console.log(accessLink);

  // NOTE: we're just copying over the password-wrapped key
  // we *are not* wrapping the key with the user's publicKey
  // that's what's supposed to be in that field.
  let invitation;
  try {
    invitation = await createInvitation(
      accessLink.share.containerId,
      accessLink.wrappedKey,
      accessLink.share.senderId,
      recipientId,
      accessLink.permission
    );
  } catch (err) {
    throw err;
  }

  try {
    return await prisma.invitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: InvitationStatus.ACCEPTED,
      },
    });
  } catch (err) {
    throw new Error(`Could not update invitation`);
  }
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
  try {
    return prisma.accessLink.delete({
      where: {
        id: linkId,
      },
    });
  } catch (err) {
    throw new Error(`Could not delete access link`);
  }
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
  let invitation;
  try {
    invitation = await prisma.invitation.findUniqueOrThrow({
      where: {
        id: invitationId,
      },
    });
  } catch (err) {
    throw new Error(`Could not find invitation`);
  }

  // get the recipientId from invitation
  // get container from the invitation
  const { recipientId, shareId } = invitation;
  console.log(
    `got share id ${shareId} from invitation, getting containerId from share`
  );

  let share;
  try {
    share = await prisma.share.findUniqueOrThrow({
      where: {
        id: shareId,
      },
    });
  } catch (err) {
    throw new Error(`Could not find share`);
  }

  const { containerId } = share;
  console.log(
    `creating membership to container ${containerId} for user ${recipientId}`
  );
  // create a new groupUser for recipientId and group
  const groupUser = await addGroupMember(containerId, recipientId);

  // Mark the invitation as accepted, if necessary.
  if (invitation.status !== InvitationStatus.ACCEPTED) {
    try {
      await prisma.invitation.update({
        where: {
          id: invitationId,
        },
        data: {
          status: InvitationStatus.ACCEPTED,
        },
      });
    } catch (err) {
      throw new Error(`Could not update invitation`);
    }
  }

  // Placeholder until #90 is addressed
  return {
    success: true,
  };
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

  // TODO: double check this, might be redundant since
  // findMany returns `[]` if no matching records.
  if (!shares) {
    return [];
  }

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

  // For placeholder error message:
  // if there's an error while creating, what couldn't we create?

  // For each share, delete corresponding access links

  for (const share of shares) {
    try {
      await prisma.accessLink.deleteMany({
        where: {
          shareId: share.id,
        },
      });
    } catch (err) {
      throw new Error(`could not delete access link`);
    }
  }

  console.log(`✅ deleted ephemeral links`);

  // get the container so we can get the
  // - groups (so we can get users)
  // - items (so we can get uploads)
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
  } catch (err) {
    throw new Error(`Could not find container`);
  }

  const users = container.group.members.map(({ user }) => user);

  console.log(`🤡 deleting items and uploads`);
  const uploadIds = container.items.map((item) => item.uploadId);

  await Promise.all(
    container.items.map(async ({ id }) => {
      console.log(`✅ deleting item ${id}`);
      try {
        return prisma.item.delete({
          where: {
            id,
          },
        });
      } catch (err) {
        throw new Error(`could not delete item`);
      }
    })
  );

  if (shouldDeleteUpload) {
    await Promise.all(
      uploadIds.map(async (id) => {
        console.log(`✅ deleting upload ${id}`);
        try {
          return prisma.upload.delete({
            where: {
              id,
            },
          });
        } catch (err) {
          throw new Error(`could not delete upload`);
        }
      })
    );
  }

  try {
    await prisma.container.delete({
      where: {
        id: containerId,
      },
    });
  } catch (err) {
    throw new Error(`could not delete container`);
  }
  console.log(`✅ deleting container ${containerId}`);

  await Promise.all(
    users.map(async ({ id, tier }) => {
      try {
        return await prisma.membership.deleteMany({
          where: {
            groupId: container.group.id,
            // don't specify the user id
            // remove all groupUser records for this group
            // userId: id,
          },
        });
      } catch (err) {
        throw new Error(`could not delete membership`);
      }
    })
  );

  // must do *after* deleting groupUser
  await Promise.all(
    users
      .filter((user) => user.tier === UserTier.EPHEMERAL)
      .map(async ({ id, tier }) => {
        try {
          await prisma.user.delete({
            where: {
              id,
            },
          });
        } catch (err) {
          throw new Error(`could not delete user`);
        }
        console.log(`✅ deleted ephemeral user ${id}`);
      })
  );

  try {
    await prisma.group.delete({
      where: {
        id: container.group.id,
      },
    });
    console.log(`✅ deleted group user ${container.group.id}`);
  } catch (err) {
    throw new Error(`could not delete group`);
  }

  // Basically, if we got this far, everything was burned successfully.
  return {
    message: 'successfully burned folder',
  };
}

export async function burnEphemeralConversation(containerId: number) {
  return await burnFolder(containerId);
}
