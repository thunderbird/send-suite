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
      user: true,
    },
  });

  return profile;
}
