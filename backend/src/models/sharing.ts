import {
  PrismaClient,
  UserTier,
  InvitationStatus,
  ContainerType,
  Share,
  Invitation,
} from '@prisma/client';
const prisma = new PrismaClient();
import { randomBytes } from 'crypto';
import { base64url } from '../utils';
import { addGroupMember } from '../models';
import { fromPrisma } from './prisma-helper';

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
  let share: Share;
  try {
    const findShareQuery = {
      where: {
        containerId,
        senderId,
      },
    };
    share = await fromPrisma(prisma.share.findFirstOrThrow, findShareQuery);
  } catch (err) {
    const createShareQuery = {
      data: {
        containerId,
        senderId,
      },
    };
    const onCreateError = () => {
      throw new Error(`Could not create share for access link`);
    };
    share = await fromPrisma(
      prisma.share.create,
      createShareQuery,
      onCreateError
    );
  }

  const id = base64url(randomBytes(64));
  let expiryDate = expiration ? new Date(expiration) : null;

  const accessLinkQuery = {
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
  };
  const onAccessLinkError = () => {
    throw new Error(`Could not create access link`);
  };
  return await fromPrisma(
    prisma.accessLink.create,
    accessLinkQuery,
    onAccessLinkError
  );
}

export async function getAccessLinkChallenge(linkId: string) {
  const query = {
    where: {
      id: linkId,
    },
    select: {
      challengeKey: true,
      challengeSalt: true,
      challengeCiphertext: true,
    },
  };
  const onError = () => {
    throw new Error(`Could not find access link`);
  };
  return await fromPrisma(prisma.accessLink.findUniqueOrThrow, query, onError);
}

export async function acceptAccessLink(
  linkId: string,
  challengePlaintext: string
) {
  const query = {
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
  };
  const onError = () => {
    throw new Error(`Could not find access link`);
  };
  return await fromPrisma(prisma.accessLink.findUniqueOrThrow, query, onError);
}

export async function getContainerForAccessLink(linkId: string) {
  const query = {
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
  };
  const onError = () => {
    throw new Error(`Could not find access link`);
  };
  return await fromPrisma(prisma.accessLink.findUniqueOrThrow, query, onError);
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
  let share: Share;

  try {
    const findShareQuery = {
      where: {
        containerId,
        senderId,
      },
    };
    share = await fromPrisma(prisma.share.findFirstOrThrow, findShareQuery);
  } catch (err) {
    const createShareQuery = {
      data: {
        containerId,
        senderId,
      },
    };
    const onCreateShareError = () => {
      throw new Error(`Could not create share for invitation`);
    };
    share = await fromPrisma(
      prisma.share.create,
      createShareQuery,
      onCreateShareError
    );
  }

  let invitation: Invitation;
  try {
    const findInvitationQuery = {
      where: {
        shareId: share.id,
        recipientId,
      },
    };
    invitation = await fromPrisma(
      prisma.invitation.findFirstOrThrow,
      findInvitationQuery
    );
  } catch (err) {
    const createInvitationQuery = {
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
    };
    const onCreateInvitationError = () => {
      throw new Error(`Could not create invitation`);
    };
    invitation = await fromPrisma(
      prisma.invitation.create,
      createInvitationQuery,
      onCreateInvitationError
    );
  }

  return invitation;
}

export async function createInvitationFromAccessLink(
  linkId: string,
  recipientId: number
) {
  const findAccessLinkQuery = {
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
  };
  const onFindAccessLinkError = () => {
    throw new Error(`Could not find access link`);
  };
  const accessLink = await fromPrisma(
    prisma.accessLink.findUniqueOrThrow,
    findAccessLinkQuery,
    onFindAccessLinkError
  );

  // NOTE: we're just copying over the password-wrapped key
  // we *are not* wrapping the key with the user's publicKey
  // that's what's supposed to be in that field.
  const invitation = await createInvitation(
    accessLink.share.containerId,
    accessLink.wrappedKey,
    accessLink.share.senderId,
    recipientId,
    accessLink.permission
  );

  const updateInvitationQuery = {
    where: {
      id: invitation.id,
    },
    data: {
      status: InvitationStatus.ACCEPTED,
    },
  };
  const onUpdateError = () => {
    throw new Error(`Could not update invitation`);
  };
  return await fromPrisma(
    prisma.invitation.update,
    updateInvitationQuery,
    onUpdateError
  );
}

export async function isAccessLinkValid(linkId: string) {
  const now = new Date();
  const query = {
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
  };
  const results = await fromPrisma(prisma.accessLink.findMany, query);
  return results.length > 0 ? results[0] : null;
}

export async function removeAccessLink(linkId: string) {
  const query = {
    where: {
      id: linkId,
    },
  };
  const onError = () => {
    throw new Error(`Could not delete access link`);
  };
  return await fromPrisma(prisma.accessLink.delete, query, onError);
}

export async function getAllInvitations(userId: number) {
  const query = {
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
  };
  return await fromPrisma(prisma.invitation.findMany, query);
}

export async function acceptInvitation(invitationId: number) {
  const findInvitationQuery = {
    where: {
      id: invitationId,
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

  const { recipientId, shareId } = invitation;
  const findShareQuery = {
    where: {
      id: shareId,
    },
  };
  const onFindShareError = () => {
    throw new Error(`Could not find share`);
  };
  const share = await fromPrisma(
    prisma.share.findUniqueOrThrow,
    findShareQuery,
    onFindShareError
  );

  const { containerId } = share;

  // create a new groupUser for recipientId and group
  const groupUser = await addGroupMember(containerId, recipientId);

  // Mark the invitation as accepted, if necessary.
  if (invitation.status !== InvitationStatus.ACCEPTED) {
    try {
      const updateInvtationQuery = {
        where: {
          id: invitationId,
        },
        data: {
          status: InvitationStatus.ACCEPTED,
        },
      };
      await fromPrisma(prisma.invitation.update, updateInvtationQuery);
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
  const query = {
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
  };

  const shares = await fromPrisma(prisma.share.findMany, query);

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
  const query = {
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
  };
  const invitations = await fromPrisma(prisma.invitation.findMany, query);
  return invitations.filter((i) => i.share.container.type === type);
}

export async function burnFolder(
  containerId: number,
  shouldDeleteUpload?: boolean
) {
  // delete the ephemeral link
  console.log(`🤡 burning container id: ${containerId}`);
  const findShareQuery = {
    where: {
      containerId,
    },
  };
  const shares = await fromPrisma(prisma.share.findMany, findShareQuery);

  // For each share, delete corresponding access links
  for (const share of shares) {
    const deleteSharesQuery = {
      where: {
        shareId: share.id,
      },
    };
    const onDeleteShareError = () => {
      throw new Error(`could not delete access link`);
    };
    await fromPrisma(
      prisma.accessLink.deleteMany,
      deleteSharesQuery,
      onDeleteShareError
    );
  }

  console.log(`✅ deleted ephemeral links`);

  // get the container so we can get the
  // - groups (so we can get users)
  // - items (so we can get uploads)
  const findContainersQuery = {
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
  };
  const findContainerError = () => {
    throw new Error(`Could not find container`);
  };
  const container = await fromPrisma(
    prisma.container.findUniqueOrThrow,
    findContainersQuery,
    findContainerError
  );

  const users = container.group.members.map(({ user }) => user);

  console.log(`🤡 deleting items and uploads`);
  const uploadIds = container.items.map((item) => item.uploadId);

  await Promise.all(
    container.items.map(async ({ id }) => {
      console.log(`✅ deleting item ${id}`);
      const deleteItemQuery = {
        where: {
          id,
        },
      };
      const onDeleteError = () => {
        throw new Error(`could not delete item`);
      };
      return fromPrisma(prisma.item.delete, deleteItemQuery, onDeleteError);
    })
  );

  if (shouldDeleteUpload) {
    await Promise.all(
      uploadIds.map(async (id) => {
        console.log(`✅ deleting upload ${id}`);
        const deleteUploadQuery = {
          where: {
            id,
          },
        };
        const onDeleteUploadError = () => {
          throw new Error(`could not delete upload`);
        };
        return fromPrisma(
          prisma.upload.delete,
          deleteUploadQuery,
          onDeleteUploadError
        );
      })
    );
  }

  const deleteContainerQuery = {
    where: {
      id: containerId,
    },
  };
  const onDeleteContainerError = () => {
    throw new Error(`could not delete container`);
  };
  await fromPrisma(
    prisma.container.delete,
    deleteContainerQuery,
    onDeleteContainerError
  );
  console.log(`✅ deleting container ${containerId}`);

  await Promise.all(
    users.map(async ({ id, tier }) => {
      const deleteMembershipQuery = {
        where: {
          groupId: container.group.id,
          // don't specify the user id
          // remove all groupUser records for this group
          // userId: id,
        },
      };
      const onDeleteMembershipError = () => {
        throw new Error(`could not delete membership`);
      };
      return fromPrisma(
        prisma.membership.deleteMany,
        deleteMembershipQuery,
        onDeleteMembershipError
      );
    })
  );

  // must do *after* deleting groupUser
  await Promise.all(
    users
      .filter((user) => user.tier === UserTier.EPHEMERAL)
      .map(async ({ id, tier }) => {
        const userDeleteQuery = {
          where: {
            id,
          },
        };
        const onUserDeleteError = () => {
          throw new Error(`could not delete user`);
        };
        await fromPrisma(
          prisma.user.delete,
          userDeleteQuery,
          onUserDeleteError
        );
      })
  );

  const groupDeleteQuery = {
    where: {
      id: container.group.id,
    },
  };
  const onGroupDeleteError = () => {
    throw new Error(`could not delete group`);
  };
  await fromPrisma(prisma.group.delete, groupDeleteQuery, onGroupDeleteError);

  // Basically, if we got this far, everything was burned successfully.
  return {
    message: 'successfully burned folder',
  };
}

export async function burnEphemeralConversation(containerId: number) {
  return await burnFolder(containerId);
}
