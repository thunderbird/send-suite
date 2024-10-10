import { Router } from 'express';
import {
  addErrorHandling,
  AUTH_ERRORS,
  wrapAsyncHandler,
} from '../errors/routes';

import { User } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { requireJWT } from '../middleware';
import { getSessionUserOrThrow } from '../utils/session';

export type AuthResponse = {
  id: User['id'];
  uniqueHash: User['uniqueHash'];
};

const router: Router = Router();

router.get(
  '/',
  addErrorHandling(AUTH_ERRORS.LOG_IN_FAILED),
  wrapAsyncHandler(async (req, res) => {
    const { uniqueHash } = getSessionUserOrThrow(req);
    const jwtToken = jwt.sign(
      { uniqueHash, id: req.session.user.id },
      process.env.ACCESS_TOKEN_SECRET || 'your_default_secret',
      { expiresIn: '30d' }
    );
    return res.json({
      token: jwtToken,
    });
  })
);

router.get(
  '/me',
  requireJWT,
  addErrorHandling(AUTH_ERRORS.AUTH_FAILED),
  wrapAsyncHandler(async (_, res) => {
    return res.json({ message: 'success' });
  })
);

export default router;
