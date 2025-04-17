/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ContainerType,
  Invitation,
  InvitationStatus,
  PrismaClient,
  Share,
  UserTier,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { MAX_ACCESS_LINK_RETRIES } from '@/config';
import {
  ACCESSLINK_NOT_DELETED,
  ACCESSLINK_NOT_FOUND,
  CONTAINER_NOT_DELETED,
  CONTAINER_NOT_FOUND,
  GROUP_NOT_DELETED,
  INVITATION_NOT_CREATED,
  INVITATION_NOT_FOUND,
  INVITATION_NOT_UPDATED,
  ITEM_NOT_DELETED,
  MEMBERSHIP_NOT_DELETED,
  SHARE_NOT_CREATED,
  SHARE_NOT_DELETED,
  SHARE_NOT_FOUND,
  UPLOAD_NOT_DELETED,
  USER_NOT_DELETED,
} from '../errors/models';
import { addGroupMember } from '../models';
import storage from '../storage';
import { fromPrismaV2 } from './prisma-helper';
const prisma = new PrismaClient();

const onFindShareError = () => {
  throw new Error(`Could not find existing share for access link`);
};
const onCreateError = () => {
  throw new Error(`Could not create share for access link`);
};

/**
 * Create Access Link
 * Creates an access link for a container.
 * Looks for an existing share (which connects access links to containers).
 * If one is not found, a new share is created.
 * Function will throw an error if unable to create the new share or the access link.
 */
export async function createAccessLink(
  containerId: string,
  senderId: string,
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

  const findShareQuery = {
    where: {
      containerId,
      senderId,
    },
  };

  const existingShare = await fromPrismaV2(
    prisma.share.findFirst,
    findShareQuery,
    onFindShareError
  );

  if (!existingShare?.id) {
    const createShareQuery = {
      data: {
        containerId,
        senderId,
      },
    };

    share = await fromPrismaV2(
      prisma.share.create,
      createShareQuery,
      onCreateError
    );
  } else {
    share = existingShare;
  }

  const id = uuidv4();
  const expiryDate = expiration ? new Date(expiration) : null;

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
  return await fromPrismaV2(
    prisma.accessLink.create,
    accessLinkQuery,
    onAccessLinkError
  );
}

export async function updateAccessLink(linkId: string, password: string) {
  return await fromPrismaV2(prisma.accessLink.update, {
    where: {
      id: linkId,
    },
    data: {
      passwordHash: password,
    },
    select: {
      id: true,
      passwordHash: true,
    },
  });
}

export async function incrementAccessLinkRetryCount(linkId: string) {
  const response = await prisma.accessLink.update({
    where: {
      id: linkId,
    },
    data: {
      retryCount: {
        increment: 1,
      },
    },
    select: {
      id: true,
      retryCount: true,
      locked: true,
    },
  });

  if (response.retryCount >= MAX_ACCESS_LINK_RETRIES) {
    await prisma.accessLink.update({
      where: {
        id: linkId,
      },
      data: {
        locked: true,
      },
    });
  }

  return response;
}

export async function getAccessLinkRetryCount(linkId: string) {
  return await prisma.accessLink.findFirst({
    where: {
      id: linkId,
    },
    select: {
      id: true,
      retryCount: true,
    },
  });
}

export async function resetAccessLinkRetryCount(linkId: string) {
  return await prisma.accessLink.update({
    where: {
      id: linkId,
    },
    data: {
      retryCount: 0,
    },
    select: {
      id: true,
    },
  });
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

  return await fromPrismaV2(
    prisma.accessLink.findUniqueOrThrow,
    query,
    ACCESSLINK_NOT_FOUND
  );
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

  return await fromPrismaV2(
    prisma.accessLink.findUniqueOrThrow,
    query,
    ACCESSLINK_NOT_FOUND
  );
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
                where: {
                  upload: {
                    isNot: {
                      reported: true,
                    },
                  },
                },
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

  const result = await fromPrismaV2(
    prisma.accessLink.findUniqueOrThrow,
    query,
    ACCESSLINK_NOT_FOUND
  );
  return result?.share.container;
}

/**
 * Finds share for container, or creates share if none exist.
 * TODO: Need to specify which share, in case there are multiple?
 */
export async function createInvitation(
  containerId: string,
  wrappedKey: string,
  senderId: string,
  recipientId: string,
  permission: number
) {
  let share: Share;
  try {
    const findShareQuery = {
      where: {
        containerId,
        senderId,
      },
    };
    share = await fromPrismaV2(prisma.share.findFirstOrThrow, findShareQuery);
  } catch (err) {
    const createShareQuery = {
      data: {
        containerId,
        senderId,
      },
    };

    share = await fromPrismaV2(
      prisma.share.create,
      createShareQuery,
      SHARE_NOT_CREATED
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
    invitation = await fromPrismaV2(
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

    invitation = await fromPrismaV2(
      prisma.invitation.create,
      createInvitationQuery,
      INVITATION_NOT_CREATED
    );
  }

  return invitation;
}

export async function createInvitationFromAccessLink(
  linkId: string,
  recipientId: string
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

  const accessLink = await fromPrismaV2(
    prisma.accessLink.findUniqueOrThrow,
    findAccessLinkQuery,
    ACCESSLINK_NOT_FOUND
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

  return await fromPrismaV2(
    prisma.invitation.update,
    updateInvitationQuery,
    INVITATION_NOT_UPDATED
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
  const results = await fromPrismaV2(prisma.accessLink.findMany, query);
  return results.length > 0 ? results[0] : null;
}

export async function removeAccessLink(linkId: string) {
  const query = {
    where: {
      id: linkId,
    },
  };

  return await fromPrismaV2(
    prisma.accessLink.delete,
    query,
    ACCESSLINK_NOT_DELETED
  );
}

export async function getAllInvitations(userId: string) {
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
  return await fromPrismaV2(prisma.invitation.findMany, query);
}

export async function acceptInvitation(invitationId: number) {
  const findInvitationQuery = {
    where: {
      id: invitationId,
    },
  };

  const invitation = await fromPrismaV2(
    prisma.invitation.findUniqueOrThrow,
    findInvitationQuery,
    INVITATION_NOT_FOUND
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
  const share = await fromPrismaV2(
    prisma.share.findUniqueOrThrow,
    findShareQuery,
    onFindShareError
  );

  const { containerId } = share;

  // create a new groupUser for recipientId and group
  await addGroupMember(containerId, recipientId);

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
      await fromPrismaV2(prisma.invitation.update, updateInvtationQuery);
    } catch (err) {
      throw new Error(`Could not update invitation`);
    }
  }

  // Placeholder until #90 is addressed
  return {
    success: true,
  };
}

export async function getContainersSharedByUser(
  userId: string
  // _type: ContainerType
) {
  const query = {
    where: {
      senderId: userId,
    },
    include: {
      sender: {
        select: {
          id: true,
          email: true,
          tier: true,
        },
      },
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
      accessLinks: {
        select: {
          id: true,
          shareId: true,
          expiryDate: true,
        },
      },
    },
  };

  const shares = await fromPrismaV2(prisma.share.findMany, query);

  // TODO: double check this, might be redundant since
  // findMany returns `[]` if no matching records.
  if (!shares) {
    return [];
  }

  return shares;
}

export async function getContainersSharedWithUser(
  recipientId: string,
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
  const invitations = await fromPrismaV2(prisma.invitation.findMany, query);
  return invitations.filter((i) => i.share.container.type === type);
}

export async function burnFolder(
  containerId: string,
  shouldDeleteUpload?: boolean
) {
  // delete the ephemeral link
  const findShareQuery = {
    where: {
      containerId,
    },
  };

  const shares = await fromPrismaV2(
    prisma.share.findMany,
    findShareQuery,
    SHARE_NOT_FOUND
  );

  // For each share, delete corresponding access links
  for (const share of shares) {
    const deleteSharesQuery = {
      where: {
        shareId: share.id,
      },
    };

    await fromPrismaV2(
      prisma.accessLink.deleteMany,
      deleteSharesQuery,
      SHARE_NOT_DELETED
    );
  }

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

  const container = await fromPrismaV2(
    prisma.container.findUniqueOrThrow,
    findContainersQuery,
    CONTAINER_NOT_FOUND
  );

  const users = container.group.members.map(({ user }) => user);

  const uploadIds = container.items.map((item) => item.uploadId);

  await Promise.all(
    container.items.map(async ({ id }) => {
      const deleteItemQuery = {
        where: {
          id,
        },
      };

      return fromPrismaV2(
        prisma.item.delete,
        deleteItemQuery,
        ITEM_NOT_DELETED
      );
    })
  );

  if (shouldDeleteUpload) {
    const deleteFilePromises = (uploadIds as string[]).map((id) =>
      storage.del(id)
    );
    await Promise.all(deleteFilePromises);

    await Promise.all(
      uploadIds.map(async (id) => {
        const deleteUploadQuery = {
          where: {
            id,
          },
        };

        return fromPrismaV2(
          prisma.upload.delete,
          deleteUploadQuery,
          UPLOAD_NOT_DELETED
        );
      })
    );
  }

  const deleteContainerQuery = {
    where: {
      id: containerId,
    },
  };

  await fromPrismaV2(
    prisma.container.delete,
    deleteContainerQuery,
    CONTAINER_NOT_DELETED
  );

  await Promise.all(
    users.map(async (/* { id, tier } */) => {
      const deleteMembershipQuery = {
        where: {
          groupId: container.group.id,
          // don't specify the user id
          // remove all groupUser records for this group
          // userId: id,
        },
      };

      return fromPrismaV2(
        prisma.membership.deleteMany,
        deleteMembershipQuery,
        MEMBERSHIP_NOT_DELETED
      );
    })
  );

  // must do *after* deleting groupUser
  await Promise.all(
    users
      .filter((user) => user.tier === UserTier.EPHEMERAL)
      .map(async ({ id /* , tier */ }) => {
        const userDeleteQuery = {
          where: {
            id,
          },
        };

        await fromPrismaV2(
          prisma.user.delete,
          userDeleteQuery,
          USER_NOT_DELETED
        );
      })
  );

  const groupDeleteQuery = {
    where: {
      id: container.group.id,
    },
  };

  await fromPrismaV2(prisma.group.delete, groupDeleteQuery, GROUP_NOT_DELETED);

  // Basically, if we got this far, everything was burned successfully.
  return {
    message: 'successfully burned folder',
  };
}

export async function burnEphemeralConversation(containerId: string) {
  return await burnFolder(containerId);
}
