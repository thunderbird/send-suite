import { Router } from 'express';
import jwt from 'jsonwebtoken';
import {
  addErrorHandling,
  AUTH_ERRORS,
  wrapAsyncHandler,
} from '../errors/routes';

import { getJWTfromToken, getUserFromJWT, signJwt } from '@/auth/client';
import { getCookie } from '@/utils';
import { User } from '@prisma/client';
import { requireJWT } from '../middleware';

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
  wrapAsyncHandler(async (_, res) => {
    return res.json({ message: 'success' });
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
      signJwt(signedData, res);

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

export default router;
