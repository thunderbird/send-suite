import { ContainerType, UserTier } from '@prisma/client';

import { Router } from 'express';

import { asyncHandler, onError } from '../errors/routes';

import {
  getAllInvitations,
  getContainersSharedByMe,
  getContainersSharedWithMe,
} from '../models/sharing';

import {
  createUser,
  getUserByEmail,
  getUserPublicKey,
  updateUserPublicKey,
  getAllUserGroupContainers,
  getRecentActivity,
  setBackup,
  getBackup,
} from '../models/users';

import { requireLogin } from '../middleware';
import logger from '../logger';

const router: Router = Router();

router.get(
  '/me',
  requireLogin,
  onError(500, 'Could not get user session'),
  asyncHandler(async (req, res) => {
    // Retrieves the logged-in user from the current session
    // ok, I need to persist the user to the session, don't I?
    // am I not doing that already?
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
  onError(404, 'Could not get public key'),
  asyncHandler(async (req, res) => {
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
  onError(500, 'Could not update user profile'),
  asyncHandler(async (req, res) => {
    const {
      publicKey,
    }: {
      publicKey: string;
    } = req.body;

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
  onError(404, 'Could not get user folders'),
  asyncHandler(async (req, res) => {
    const { id } = req.session.user;
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
  onError(404, 'Could not find user'),
  asyncHandler(async (req, res) => {
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
  onError(500, 'Could not log in'),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await getUserByEmail(email);
    if (user) {
      req.session.user = user;
      req.session.save((err) => {
        if (err) {
          throw Error(`Could not save user to session`);
        } else {
          logger.info(`
          session id: ${req.session.id}
          user id in session ${req.session.user.id}
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
  onError(500, 'Could not create user'),
  asyncHandler(async (req, res) => {
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
      tier
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
  onError(404, 'Could not get containers'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const containers = await getAllUserGroupContainers(parseInt(userId), null);
    res.status(200).json(containers);
  })
);

router.get(
  '/:userId/conversations',
  onError(404, 'Could not get conversations'),
  asyncHandler(async (req, res) => {
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
  onError(404, 'Could not get activity'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const containers = await getRecentActivity(
      parseInt(userId),
      ContainerType.FOLDER
    );
    res.status(200).json(containers);
  })
);

router.get(
  '/:userId/folders/sharedByMe',
  onError(404, 'Could not get shared folders'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const containersAndMembers = await getContainersSharedByMe(
      parseInt(userId),
      ContainerType.FOLDER
    );

    res.status(200).json(containersAndMembers);
  })
);

router.get(
  '/:userId/folders/sharedWithMe',
  onError(404, 'Could not get received folders'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const containersAndMembers = await getContainersSharedWithMe(
      parseInt(userId),
      ContainerType.FOLDER
    );

    res.status(200).json(containersAndMembers);
  })
);

// Get invitations for user
router.get(
  '/:userId/invitations',
  onError(404, 'Could not get invitations'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const invitations = await getAllInvitations(parseInt(userId));
    res.status(200).json(invitations);
  })
);

router.post(
  '/:id/backup',
  onError(500, 'Could not make backup'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { keys, keypair, keystring, salt } = req.body;
    const user = await setBackup(parseInt(id), keys, keypair, keystring, salt);
    res.status(200).json({
      message: 'backup complete',
    });
  })
);

router.get(
  '/:id/backup',
  onError(404, 'Could not retrieve backup'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const backup = await getBackup(parseInt(id));
    res.status(200).json(backup);
  })
);

export default router;
