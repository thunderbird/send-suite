import * as trpcExpress from '@trpc/server/adapters/express';
import { getDataFromAuthenticatedRequest } from '../auth/client';
import { getStorageLimit } from '../auth/client';
import { getCookie } from '../utils';

export const createContext = ({
  req,
}: trpcExpress.CreateExpressContextOptions) => {
  const jwtToken = getCookie(req?.headers?.cookie, 'authorization');
  const jwtRefreshToken = getCookie(req?.headers?.cookie, 'refresh_token');

  // Make user data available to all trpc requests unless the user is not authenticated
  try {
    const { id, email, uniqueHash, tier } =
      getDataFromAuthenticatedRequest(req);

    const { daysToExpiry, hasLimitedStorage } = getStorageLimit(req);

    return {
      user: {
        id: id.toString(),
        email,
        uniqueHash,
        tier,
        daysToExpiry,
        hasLimitedStorage,
      },
      cookies: {
        jwtToken,
        jwtRefreshToken,
      },
    };
  } catch {
    // If the user is not authenticated, we return only the cookies
    return {
      user: null,
      cookies: {
        jwtToken,
        jwtRefreshToken,
      },
    };
  }
};
