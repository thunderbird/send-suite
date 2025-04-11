import { ContainerType } from '@prisma/client';

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
  getAllUserGroupContainers,
  getBackup,
  getRecentActivity,
  getUserByEmail,
  getUserById,
  getUserPublicKey,
  setBackup,
  updateUserPublicKey,
} from '../models/users';

import { getDataFromAuthenticatedRequest } from '@/auth/client';
import { requireJWT } from '../middleware';

const router: Router = Router();

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user information
 *     description: Retrieves the logged-in user from the current session
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *       404:
 *         description: User not found
 */
router.get(
  '/me',
  requireJWT,
  wrapAsyncHandler(async (req, res) => {
    // Retrieves the logged-in user from the current session
    // ok, I need to persist the user to the session, don't I?
    // am I not doing that already?
    const { id } = getDataFromAuthenticatedRequest(req);

    try {
      const user = await getUserById(id);
      return res.status(200).json({
        user,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return res.status(404).json({});
    }
  })
);

/**
 * @swagger
 * /api/users/publickey/{id}:
 *   get:
 *     summary: Get user's public key
 *     description: Retrieves the public key for a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Public key retrieved successfully
 *       404:
 *         description: Public key not found
 */
router.get(
  '/publickey/:id',
  requireJWT,
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
/**
 * @swagger
 * /api/users/publickey:
 *   post:
 *     summary: Update user's public key
 *     description: Updates the public key for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               publicKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Public key updated successfully
 *       400:
 *         description: Profile update failed
 */
router.post(
  '/publickey',
  requireJWT,
  addErrorHandling(USER_ERRORS.PROFILE_NOT_UPDATED),
  wrapAsyncHandler(async (req, res) => {
    const {
      publicKey,
    }: {
      publicKey: string;
    } = req.body;

    const { id } = getDataFromAuthenticatedRequest(req);

    const update = await updateUserPublicKey(
      id,
      JSON.stringify(publicKey).trim()
    );
    res.status(200).json({
      update,
    });
  })
);

/**
 * @swagger
 * /api/users/folders:
 *   get:
 *     summary: Get user's folders
 *     description: Retrieves all folders for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Folders retrieved successfully
 *       404:
 *         description: Folders not found
 */
router.get(
  '/folders',
  requireJWT,
  addErrorHandling(USER_ERRORS.FOLDERS_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { id } = getDataFromAuthenticatedRequest(req);

    const containers = await getAllUserGroupContainers(
      id,
      ContainerType.FOLDER
    );
    res.status(200).json(containers);
  })
);

/**
 * @swagger
 * /api/users/lookup/{email}:
 *   get:
 *     summary: Lookup user by email
 *     description: Retrieves user information by email address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: User's email address
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
router.get(
  '/lookup/:email',
  requireJWT,
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

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: User login
 *     description: Authenticates and logs in a user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Login successful
 *       404:
 *         description: Login failed
 */
router.post(
  '/login',
  requireJWT,
  addErrorHandling(USER_ERRORS.DEV_LOGIN_FAILED),
  wrapAsyncHandler(async (req, res) => {
    const { id } = getDataFromAuthenticatedRequest(req);
    const user = await getUserById(id);

    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).send();
    }
  })
);

/**
 * @swagger
 * /api/users/{userId}/containers:
 *   get:
 *     summary: Get all user containers
 *     description: Retrieves all containers for a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Containers retrieved successfully
 *       404:
 *         description: Containers not found
 */
router.get(
  '/:userId/containers',
  requireJWT,
  addErrorHandling(USER_ERRORS.FOLDERS_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { userId } = req.params;
    const containers = await getAllUserGroupContainers(parseInt(userId), null);
    res.status(200).json(containers);
  })
);

/**
 * @swagger
 * /api/users/{userId}/conversations:
 *   get:
 *     summary: Get user conversations
 *     description: Retrieves all conversations for a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *       404:
 *         description: Conversations not found
 */
router.get(
  '/:userId/conversations',
  requireJWT,
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

/**
 * @swagger
 * /api/users/{userId}/activity:
 *   get:
 *     summary: Get user activity
 *     description: Retrieves recent activity for a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Activity retrieved successfully
 *       404:
 *         description: Activity not found
 */
router.get(
  '/:userId/activity',
  requireJWT,
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

/**
 * @swagger
 * /api/users/{userId}/folders/sharedByUser:
 *   get:
 *     summary: Get folders shared by user
 *     description: Retrieves all folders that a user has shared with others
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Shared folders retrieved successfully
 *       404:
 *         description: Shared folders not found
 */
router.get(
  '/:userId/folders/sharedByUser',
  requireJWT,
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

/**
 * @swagger
 * /api/users/{userId}/folders/sharedWithUser:
 *   get:
 *     summary: Get folders shared with user
 *     description: Retrieves all folders that have been shared with a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Received folders retrieved successfully
 *       404:
 *         description: Received folders not found
 */
router.get(
  '/:userId/folders/sharedWithUser',
  requireJWT,
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

/**
 * @swagger
 * /api/users/{userId}/invitations:
 *   get:
 *     summary: Get user invitations
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves all invitations for a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Invitations retrieved successfully
 *       404:
 *         description: Invitations not found
 */
router.get(
  '/:userId/invitations',
  requireJWT,
  addErrorHandling(USER_ERRORS.INVITATIONS_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { userId } = req.params;
    const invitations = await getAllInvitations(parseInt(userId));
    res.status(200).json(invitations);
  })
);

/**
 * @swagger
 * /api/users/{id}/backup:
 *   post:
 *     summary: Create user backup
 *     description: Creates a backup for a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keys:
 *                 type: string
 *               keypair:
 *                 type: string
 *               keystring:
 *                 type: string
 *               salt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Backup created successfully
 *       400:
 *         description: Backup failed
 */
router.post(
  '/:id/backup',
  requireJWT,
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

/**
 * @swagger
 * /api/users/backup:
 *   post:
 *     summary: Create authenticated user backup
 *     description: Creates a backup for the authenticated user
 *
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keys:
 *                 type: string
 *               keypair:
 *                 type: string
 *               keystring:
 *                 type: string
 *               salt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Backup created successfully
 *       400:
 *         description: Backup failed
 */
router.post(
  '/backup',
  requireJWT,
  addErrorHandling(USER_ERRORS.BACKUP_FAILED),
  wrapAsyncHandler(async (req, res) => {
    const { id } = getDataFromAuthenticatedRequest(req);
    const { keys, keypair, keystring, salt } = req.body;
    // We're not using the return value, but we want to make sure the backup runs
    await setBackup(id, keys, keypair, keystring, salt);
    res.status(200).json({
      message: 'backup complete',
    });
  })
);

/**
 * @swagger
 * /api/users/backup:
 *   get:
 *     summary: Get authenticated user backup
 *     description: Retrieves the backup for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup retrieved successfully
 *       404:
 *         description: Backup not found
 */
router.get(
  '/backup',
  requireJWT,
  addErrorHandling(USER_ERRORS.BACKUP_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { id } = getDataFromAuthenticatedRequest(req);
    const backup = await getBackup(id);
    res.status(200).json(backup);
  })
);

/**
 * @swagger
 * /api/users/{id}/backup:
 *   get:
 *     summary: Get user backup
 *     description: Retrieves the backup for a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Backup retrieved successfully
 *       404:
 *         description: Backup not found
 */
router.get(
  '/:id/backup',
  requireJWT,
  addErrorHandling(USER_ERRORS.BACKUP_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { id } = getDataFromAuthenticatedRequest(req);
    const backup = await getBackup(id);
    res.status(200).json(backup);
  })
);

export default router;
