import { Router } from 'express';
import {
  addErrorHandling,
  AUTH_ERRORS,
  wrapAsyncHandler,
} from '../errors/routes';

import { User } from '@prisma/client';
import { requireJWT } from '../middleware';

export type AuthResponse = {
  id: User['id'];
  uniqueHash: User['uniqueHash'];
  email: User['email'];
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

export default router;
