import { PrismaClient, UserTier } from '@prisma/client';
const prisma = new PrismaClient();

// Given a Mozilla account id, find or create a Profile and linked User
export async function findOrCreateUserProfileByMozillaId(
  mozid: string,
  avatar?: string,
  email?: string,
  accessToken?: string,
  refreshToken?: string
) {
  const profile = await prisma.profile.upsert({
    where: {
      mozid,
    },
    update: {
      avatar,
      accessToken,
      refreshToken,
    },
    create: {
      mozid,
      avatar,
      accessToken,
      refreshToken,
      user: {
        create: {
          email,
          // For now, we assume they're on the FREE teir.
          tier: UserTier.FREE,
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          tier: true,
          createdAt: true,
          updatedAt: true,
          activatedAt: true,
        },
      },
    },
  });

  // Flip the nesting of the user and the profile.
  const { user } = profile;
  delete profile.user;
  user['profile'] = profile;

  return user;
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

export async function updateUserPublicKey(id: number, publicKey: string) {
  return prisma.user.update({
    where: {
      id,
    },
    data: {
      publicKey,
    },
  });
}
