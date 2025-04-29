import { Request, Router } from 'express';
import jwt from 'jsonwebtoken';
import {
  addErrorHandling,
  AUTH_ERRORS,
  wrapAsyncHandler,
} from '../errors/routes';

import {
  getDataFromAuthenticatedRequest,
  getJWTfromToken,
  getUserFromJWT,
  registerAuthToken,
  registerTokens,
} from '@/auth/client';
import { getLoginSession } from '@/models';
import { getUserByEmail, getUserById } from '@/models/users';
import { getCookie } from '@/utils';
import { User, UserTier } from '@prisma/client';
import { requireJWT, requirePublicLogin } from '../middleware';
import { logger } from '@/utils/logger';

export type AuthResponse = {
  id: User['id'];
  uniqueHash: User['uniqueHash'];
  email: User['email'];
  tier: User['tier'];
};

const router: Router = Router();

router.get(
  '/me',
  requireJWT,
  addErrorHandling(AUTH_ERRORS.AUTH_FAILED),
  wrapAsyncHandler(async (req, res) => {
    const { id } = getDataFromAuthenticatedRequest(req);

    const user = await getUserById(id);

    if (!user) {
      logger.error(`JWT user id doesn't match any users in the database`);
      return res.status(401).json({
        message: 'Authorization failed.',
      });
    }
    return res.status(200).json({
      message: 'success',
    });
  })
);

router.get(
  '/refresh',
  addErrorHandling(AUTH_ERRORS.AUTH_FAILED),
  wrapAsyncHandler(async (req, res) => {
    // try to refresh token
    try {
      const jwtRefreshToken = getCookie(req?.headers?.cookie, 'refresh_token');
      const refreshToken = getJWTfromToken(jwtRefreshToken);

      jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const signedData = getUserFromJWT(refreshToken);

      registerAuthToken(signedData, res);

      console.log('refreshed token successfully');
      return res.status(200).json({
        message: `Token refreshed successfully`,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log('error refreshing token');
      return res
        .status(500)
        .json({ message: `Not authorized: Unable to refresh token` });
    }
  })
);

// Route for obtaining an authorization URL for Mozilla account.
router.get(
  '/register',
  addErrorHandling(AUTH_ERRORS.LOG_IN_FAILED),
  requirePublicLogin,
  wrapAsyncHandler(async (req: Request, res) => {
    // We'll attempt to match this in the callback.
    try {
      const { fxasession } = await getLoginSession(req.query.state as string);
      const email = fxasession.split('____')[1];

      const userData = await getUserByEmail(email);

      const signedData: AuthResponse = {
        id: userData.id,
        uniqueHash: userData.uniqueHash,
        email,
        tier: UserTier.FREE,
      };

      registerTokens(signedData, res);
    } catch (err) {
      console.error('Could not save session in /login.', err);
      return res.status(500).json(err);
    }

    // Save session and send the auth url to the front end
    // so they can do the redirect.
    res.status(200).json({
      status: 'success',
    });
  })
);

// Route for obtaining an authorization URL for Mozilla account.
router.get(
  '/login',
  addErrorHandling(AUTH_ERRORS.LOG_IN_FAILED),
  requirePublicLogin,
  wrapAsyncHandler(async (req: Request, res) => {
    // We'll attempt to match this in the callback.
    try {
      const { fxasession } = await getLoginSession(req.query.state as string);
      const email = fxasession.split('____')[1];

      const userData = await getUserByEmail(email);

      const signedData: AuthResponse = {
        id: userData.id,
        uniqueHash: userData.uniqueHash,
        email,
        tier: UserTier.FREE,
      };

      registerTokens(signedData, res);
    } catch (err) {
      console.error('Could not save session in /login.', err);
      return res.status(500).json(err);
    }

    // Save session and send the auth url to the front end
    // so they can do the redirect.
    res.status(200).json({
      status: 'success',
    });
  })
);

export default router;
