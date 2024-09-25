import { ContainerType, UserTier } from '@prisma/client';

import 'dotenv/config';
import { Request, Router } from 'express';

import {
  addErrorHandling,
  USER_ERRORS,
  wrapAsyncHandler,
} from '../errors/routes';

import {
  getAllInvitations,
  getContainersSharedByUser,
  getContainersSharedWithUser,
} from '../models/sharing';

import {
  createUser,
  getAllUserGroupContainers,
  getBackup,
  getRecentActivity,
  getUserByEmail,
  getUserPublicKey,
  setBackup,
  updateUserPublicKey,
} from '../models/users';

import { checkAllowList } from '../auth/client';
import { BaseError, SESSION_NOT_SAVED } from '../errors/models';
import logger from '../logger';
import { requireLogin } from '../middleware';
import { getSessionUserOrThrow } from '../utils/session';

const router: Router = Router();

router.get(
  '/me',
  requireLogin,
  addErrorHandling(USER_ERRORS.SESSION_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    // If an allow list is provided, only allow users in that list
    // If there is no env variable, we allow all users
    try {
      await checkAllowList(req.session?.user?.email);
    } catch (error) {
      return res.status(401).json({
        msg: 'Not in allow list',
      });
    }

    // Retrieves the logged-in user from the current session
    // ok, I need to persist the user to the session, don't I?
    // am I not doing that already?
    console.log('session id: ', req.session.id);
    const user = req.session.user;
    if (!user) {
      return res.status(404).json({});
    }

    res.status(200).json({
      user,
    });
  })
);

router.get(
  '/publickey/:id',
  addErrorHandling(USER_ERRORS.PUBLIC_KEY_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await getUserPublicKey(parseInt(id));
    res.status(200).json(user);
  })
);

// Update user's public key
// TODO: decide whether this should just be a "profile update" function
// that can take any of the following: email, publicKey, avatar...
router.post(
  '/publickey',
  requireLogin,
  addErrorHandling(USER_ERRORS.PROFILE_NOT_UPDATED),
  wrapAsyncHandler(async (req, res) => {
    const {
      publicKey,
    }: {
      publicKey: string;
    } = req.body;

    if (!req.session?.user?.id) {
      return res.status(401).json({
        msg: 'User not found in session',
      });
    }

    const { id } = req.session.user;
    const update = await updateUserPublicKey(
      id,
      JSON.stringify(publicKey).trim()
    );
    res.status(200).json({
      update,
    });
  })
);

router.get(
  '/folders',
  requireLogin,
  addErrorHandling(USER_ERRORS.FOLDERS_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    try {
      await checkAllowList(req.session?.user?.email);
    } catch (error) {
      /* 
      TODO: Type this response correctly on the frontend
      Since the frontend is expecting an array of folders,
      we need to return an empty array of items.
       */

      return res.status(401).json([{ id: 0, items: [] }]);
    }

    const { id } = getSessionUserOrThrow(req);

    const containers = await getAllUserGroupContainers(
      id,
      ContainerType.FOLDER
    );
    res.status(200).json(containers);
  })
);

router.get(
  '/lookup/:email',
  requireLogin,
  addErrorHandling(USER_ERRORS.USER_NOT_FOUND),
  wrapAsyncHandler(async (req: Request, res) => {
    const { email } = req.params;
    const user = await getUserByEmail(email);
    res.status(200).json(user);
  })
);
// everything above this line is confirmed for q1-dogfood use
// ==================================================================================

// TODO: shift userId to session and out of req.params

router.post(
  '/login',
  addErrorHandling(USER_ERRORS.DEV_LOGIN_FAILED),
  wrapAsyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await getUserByEmail(email);

    if (user) {
      req.session.user = user;
      req.session.save((err) => {
        if (err) {
          throw new BaseError(SESSION_NOT_SAVED);
        } else {
          logger.info(`
          session id: ${req.session.id}
          user id in session ${req.session?.user?.id}
          `);
          res.status(200).json(user);
        }
      });
    } else {
      res.status(404).send();
    }
  })
);

router.post(
  '/',
  addErrorHandling(USER_ERRORS.USER_NOT_CREATED),
  wrapAsyncHandler(async (req, res) => {
    const {
      publicKey,
      email,
      tier,
    }: {
      publicKey: string;
      email: string;
      tier: UserTier | null;
    } = req.body;
    let userEmail = email;
    if (email) {
      userEmail = email.trim().toLowerCase();
    }
    const user = await createUser(
      JSON.stringify(publicKey).trim(),
      userEmail,
      tier || undefined
    );
    res.status(201).json({
      message: 'User created',
      user,
    });
  })
);

// All containers, regardless of type
router.get(
  '/:userId/containers',
  addErrorHandling(USER_ERRORS.FOLDERS_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { userId } = req.params;
    const containers = await getAllUserGroupContainers(parseInt(userId), null);
    res.status(200).json(containers);
  })
);

router.get(
  '/:userId/conversations',
  addErrorHandling(USER_ERRORS.FOLDERS_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { userId } = req.params;
    const containers = await getAllUserGroupContainers(
      parseInt(userId),
      ContainerType.CONVERSATION
    );
    res.status(200).json(containers);
  })
);

router.get(
  '/:userId/activity',
  addErrorHandling(USER_ERRORS.HISTORY_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { userId } = req.params;
    const containers = await getRecentActivity(
      parseInt(userId),
      ContainerType.FOLDER
    );
    res.status(200).json(containers);
  })
);

router.get(
  '/:userId/folders/sharedByUser',
  addErrorHandling(USER_ERRORS.SHARED_FOLDERS_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { userId } = req.params;
    const containersAndMembers = await getContainersSharedByUser(
      parseInt(userId)
      /*
       * TODO: This functionality is incomplete. The previous functionality used this second parameter
       * We're keeping it to pick it up later.
       */
      // ContainerType.FOLDER
    );

    res.status(200).json(containersAndMembers);
  })
);

router.get(
  '/:userId/folders/sharedWithUser',
  addErrorHandling(USER_ERRORS.RECEIVED_FOLDERS_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { userId } = req.params;
    const containersAndMembers = await getContainersSharedWithUser(
      parseInt(userId),
      ContainerType.FOLDER
    );

    res.status(200).json(containersAndMembers);
  })
);

// Get invitations for user
router.get(
  '/:userId/invitations',
  addErrorHandling(USER_ERRORS.INVITATIONS_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { userId } = req.params;
    const invitations = await getAllInvitations(parseInt(userId));
    res.status(200).json(invitations);
  })
);

router.post(
  '/:id/backup',
  addErrorHandling(USER_ERRORS.BACKUP_FAILED),
  wrapAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { keys, keypair, keystring, salt } = req.body;
    // We're not using the return value, but we want to make sure the backup runs
    await setBackup(parseInt(id), keys, keypair, keystring, salt);
    res.status(200).json({
      message: 'backup complete',
    });
  })
);

router.post(
  '/backup',
  addErrorHandling(USER_ERRORS.BACKUP_FAILED),
  wrapAsyncHandler(async (req, res) => {
    const { id } = getSessionUserOrThrow(req);
    const { keys, keypair, keystring, salt } = req.body;
    // We're not using the return value, but we want to make sure the backup runs
    await setBackup(id, keys, keypair, keystring, salt);
    res.status(200).json({
      message: 'backup complete',
    });
  })
);

router.get(
  '/backup',
  addErrorHandling(USER_ERRORS.BACKUP_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const userIDFomSession = getSessionUserOrThrow(req);
    const backup = await getBackup(userIDFomSession.id);
    res.status(200).json(backup);
  })
);

router.get(
  '/:id/backup',
  addErrorHandling(USER_ERRORS.BACKUP_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const userIDFomSession = getSessionUserOrThrow(req);
    const backup = await getBackup(userIDFomSession.id);
    res.status(200).json(backup);
  })
);

export default router;
