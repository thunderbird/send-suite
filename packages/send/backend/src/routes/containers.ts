import { ContainerType } from '@prisma/client';
import { Router } from 'express';
import {
  addGroupMember,
  createItem,
  deleteItem,
  getContainerInfo,
  getContainerWithDescendants,
  getContainerWithMembers,
  getSharesForContainer,
  removeGroupMember,
  removeInvitationAndGroup,
  reportUpload,
  updateAccessLinkPermissions,
  updateInvitationPermissions,
  updateItemName,
} from '../models';

import {
  getGroupMemberPermissions,
  renameBodyProperty,
  requireAdminPermission,
  requireJWT,
  requireReadPermission,
  requireWritePermission,
} from '../middleware';

import {
  addErrorHandling,
  CONTAINER_ERRORS,
  wrapAsyncHandler,
} from '../errors/routes';

import { burnFolder, createInvitation } from '../models/sharing';

import {
  createContainer,
  getAccessLinksForContainer,
  getContainerWithAncestors,
  getItemsInContainer,
  updateContainerName,
} from '../models/containers';

import {
  getDataFromAuthenticatedRequest,
  getStorageLimit,
} from '@/auth/client';
import { addExpiryToContainer } from '@/utils';

const router: Router = Router();

export interface TreeNode {
  id: string;
  children: TreeNode[];
}

export function flattenDescendants(tree: TreeNode): string[] {
  if (!tree || !tree.id) {
    return [];
  }
  const children = tree?.children?.length > 0 ? tree.children : [];
  return [
    ...children.flatMap((child: TreeNode) => flattenDescendants(child)),
    tree.id,
  ];
}

/**
 * @openapi
 * /api/containers/{containerId}:
 *   get:
 *     summary: Get a container and its items
 *     tags: [Containers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: containerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Container retrieved successfully
 *       404:
 *         description: Container not found
 */
// Get a container and its items
// Add the ancestor folder path as a property.
router.get(
  '/:containerId',
  requireJWT,
  getGroupMemberPermissions,
  requireReadPermission,
  addErrorHandling(CONTAINER_ERRORS.CONTAINER_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const container = await getItemsInContainer(containerId);
    const { hasLimitedStorage } = getStorageLimit(req);

    if (!container) {
      throw new Error();
    }

    if (container.parentId) {
      container['parent'] = await getContainerWithAncestors(container.parentId);
    }

    const itemsWithExpiry = {
      ...container,
      items: container.items.map((item) => ({
        ...item,
        upload: addExpiryToContainer(item.upload),
      })),
    };

    res.status(200).json(hasLimitedStorage ? itemsWithExpiry : container);
  })
);

/**
 * @openapi
 * /api/containers/{containerId}/links:
 *   get:
 *     summary: Get all Access Links for a container
 *     tags: [Containers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: containerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Access Links retrieved successfully
 *       404:
 *         description: Access Links not found
 */
// Get all Access Links for a container
router.get(
  '/:containerId/links',
  requireJWT,
  getGroupMemberPermissions,
  requireReadPermission,
  addErrorHandling(CONTAINER_ERRORS.ACCESS_LINKS_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const links = await getAccessLinksForContainer(containerId);
    res.status(200).json(links);
  })
);

/**
 * @openapi
 * /api/containers:
 *   post:
 *     summary: Create a new container
 *     tags: [Containers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [FOLDER, CONVERSATION]
 *     responses:
 *       201:
 *         description: Container created successfully
 *       400:
 *         description: Failed to create container
 */
// Create a container
// When creating a subfolder in Lockbox, the front-end will pass in the parent folder id
// as `req.body.parentId`. But, to use `getPermissions`, we need to rename that property
// to `req.body.containerId`.
// `renameBodyProperty` is a no-op when creating a top-level folder in Lockbox.
router.post(
  '/',
  requireJWT,
  renameBodyProperty('parentId', 'containerId'),
  getGroupMemberPermissions,
  requireWritePermission,
  addErrorHandling(CONTAINER_ERRORS.CONTAINER_NOT_CREATED),
  wrapAsyncHandler(async (req, res) => {
    const {
      name,
      type,
    }: {
      name: string;
      type: ContainerType;
    } = req.body;

    const { id } = getDataFromAuthenticatedRequest(req);

    const ownerId = id;

    let shareOnly = false;
    if (req.body.shareOnly) {
      shareOnly = req.body.shareOnly;
    }

    const parentId = req.body.containerId;

    const container = await createContainer(
      name.trim().toLowerCase(),
      ownerId!,
      type,
      parentId,
      shareOnly
    );
    res.status(201).json({
      message: 'Container created',
      container,
    });
  })
);

/**
 * @openapi
 * /api/containers/{containerId}/rename:
 *   post:
 *     summary: Rename a container
 *     tags: [Containers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: containerId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Container renamed successfully
 *       400:
 *         description: Failed to rename container
 */
// Rename a container
router.post(
  '/:containerId/rename',
  requireJWT,
  getGroupMemberPermissions,
  requireWritePermission,
  addErrorHandling(CONTAINER_ERRORS.CONTAINER_NOT_RENAMED),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const { name } = req.body;
    const container = await updateContainerName(containerId, name);
    res.status(200).json(container);
  })
);

/**
 * @openapi
 * /api/containers/{containerId}:
 *   delete:
 *     summary: Delete a container
 *     tags: [Containers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: containerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Container deleted successfully
 *       404:
 *         description: Container not found
 */
// TODO: think about whether we can be admin of a folder that contains folders we don't own.
router.delete(
  '/:containerId',
  requireJWT,
  getGroupMemberPermissions,
  requireAdminPermission,
  addErrorHandling(CONTAINER_ERRORS.CONTAINER_NOT_DELETED),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const root = await getContainerWithDescendants(containerId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const idArray = flattenDescendants(root as any);

    const burnPromises = idArray.map((id: string) =>
      burnFolder(id, true /* shouldDeleteUpload */)
    );

    const result = await Promise.all(burnPromises);
    res.status(200).json({
      result,
    });
  })
);
// everything above this line is confirmed for q1-dogfood use
// ==================================================================================

/**
 * @openapi
 * /api/containers/{containerId}/item:
 *   post:
 *     summary: Add an item to a container
 *     tags: [Containers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: containerId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               uploadId:
 *                 type: integer
 *               type:
 *                 type: string
 *               wrappedKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item added successfully
 *       400:
 *         description: Failed to add item
 */
// Add an Item
router.post(
  '/:containerId/item',
  getGroupMemberPermissions,
  addErrorHandling(CONTAINER_ERRORS.ITEM_NOT_CREATED),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const { name, uploadId, type, wrappedKey } = req.body;
    const item = await createItem(
      name,
      containerId,
      uploadId,
      type,
      wrappedKey
    );
    res.status(200).json(item);
  })
);

/**
 * @openapi
 * /api/containers/{containerId}/item/{itemId}:
 *   delete:
 *     summary: Remove an item from a container
 *     tags: [Containers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: containerId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item removed successfully
 *       404:
 *         description: Item or container not found
 */
router.delete(
  '/:containerId/item/:itemId',
  getGroupMemberPermissions,
  addErrorHandling(CONTAINER_ERRORS.ITEM_NOT_DELETED),
  wrapAsyncHandler(async (req, res) => {
    const { itemId } = req.params;
    // Force req.body.shouldDeleteUpload to a boolean
    const shouldDeleteUpload = !!req.body.shouldDeleteUpload;
    const result = await deleteItem(parseInt(itemId), shouldDeleteUpload);
    res.status(200).json(result);
  })
);

/**
 * @openapi
 * /api/containers/{containerId}/item/{itemId}/rename:
 *   post:
 *     summary: Rename an item in a container
 *     tags: [Containers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: containerId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item renamed successfully
 *       400:
 *         description: Failed to rename item
 */
// Rename an item in a container
router.post(
  '/:containerId/item/:itemId/rename',
  getGroupMemberPermissions,
  addErrorHandling(CONTAINER_ERRORS.ITEM_NOT_RENAMED),
  wrapAsyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { name } = req.body;
    const item = await updateItemName(parseInt(itemId), name);
    res.status(200).json(item);
  })
);

/**
 * @openapi
 * /api/containers/{containerId}/report:
 *   post:
 *     summary: Report an upload in a container
 *     tags: [Containers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uploadId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Upload reported successfully
 *       400:
 *         description: Failed to report upload
 */
// Report an upload in a container
router.post(
  '/:containerId/report',
  addErrorHandling(CONTAINER_ERRORS.ITEM_NOT_REPORTED),
  wrapAsyncHandler(async (req, res) => {
    const { uploadId } = req.body;
    await reportUpload(uploadId);
    res.status(200).json({ message: 'reported successfully' });
  })
);

/**
 * @openapi
 * /api/containers/{containerId}/member/invite:
 *   post:
 *     summary: Invite a member to a container
 *     tags: [Containers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: containerId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderId:
 *                 type: integer
 *               recipientId:
 *                 type: integer
 *               wrappedKey:
 *                 type: string
 *               permission:
 *                 type: string
 *     responses:
 *       200:
 *         description: Member invited successfully
 *       400:
 *         description: Failed to invite member
 */
// Invite a member to a container
router.post(
  '/:containerId/member/invite',
  getGroupMemberPermissions,
  addErrorHandling(CONTAINER_ERRORS.INVITATION_NOT_CREATED),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const { senderId, recipientId, wrappedKey } = req.body;
    let permission = '0';
    if (req.body.permission) {
      permission = req.body.permission;
    }
    const invitation = await createInvitation(
      containerId,
      wrappedKey,
      senderId,
      recipientId,
      parseInt(permission)
    );
    res.status(200).json(invitation);
  })
);

/**
 * @openapi
 * /api/containers/{containerId}/member/remove/{invitationId}:
 *   delete:
 *     summary: Remove invitation and group membership
 *     tags: [Containers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: containerId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Invitation and group membership removed successfully
 *       400:
 *         description: Failed to remove invitation and group membership
 */
// Remove invitation and group membership
router.delete(
  '/:containerId/member/remove/:invitationId',
  addErrorHandling(CONTAINER_ERRORS.INVITATION_NOT_DELETED),
  wrapAsyncHandler(async (req, res) => {
    const { invitationId } = req.params;
    const result = await removeInvitationAndGroup(parseInt(invitationId));
    res.status(200).json(result);
  })
);

/**
 * @openapi
 * /api/containers/{containerId}/member:
 *   post:
 *     summary: Add a member to access group for container
 *     tags: [Containers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: containerId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Member added successfully
 *       400:
 *         description: Failed to add member
 */
// Add member to access group for container
router.post(
  '/:containerId/member',
  getGroupMemberPermissions,
  addErrorHandling(CONTAINER_ERRORS.MEMBER_NOT_CREATED),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const { userId } = req.body;
    const container = await addGroupMember(containerId, userId);
    res.status(200).json(container);
  })
);

/**
 * @openapi
 * /api/containers/{containerId}/member/{userId}:
 *   delete:
 *     summary: Remove a member from access group for container
 *     tags: [Containers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: containerId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       404:
 *         description: Member or container not found
 */
// Remove member from access group for container
router.delete(
  '/:containerId/member/:userId',
  getGroupMemberPermissions,
  addErrorHandling(CONTAINER_ERRORS.MEMBER_NOT_DELETED),
  wrapAsyncHandler(async (req, res) => {
    const { containerId, userId } = req.params;
    const container = await removeGroupMember(containerId, userId);
    res.status(200).json(container);
  })
);

/**
 * @openapi
 * /api/containers/{containerId}/members:
 *   get:
 *     summary: Get all members for a container
 *     tags: [Containers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: containerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Members retrieved successfully
 *       404:
 *         description: Members not found
 */
// Get all members for a container
router.get(
  '/:containerId/members',
  getGroupMemberPermissions,
  addErrorHandling(CONTAINER_ERRORS.MEMBERS_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    // getContainerWithMembers
    const { containerId } = req.params;
    const { group } = await getContainerWithMembers(containerId);
    res.status(200).json(group.members);
  })
);

/**
 * @openapi
 * /api/containers/{containerId}/info:
 *   get:
 *     summary: Get container info
 *     tags: [Containers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: containerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Container info retrieved successfully
 *       404:
 *         description: Container info not found
 */
// Get container info
router.get(
  '/:containerId/info',
  getGroupMemberPermissions,
  addErrorHandling(CONTAINER_ERRORS.INFO_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const container = await getContainerInfo(containerId);
    res.status(200).json(container);
  })
);

/**
 * @openapi
 * /api/containers/{containerId}/shares:
 *   get:
 *     summary: Get all shares for a container
 *     tags: [Containers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: containerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Shares retrieved successfully
 *       404:
 *         description: Shares not found
 */
// Get all shares for a container
router.get(
  '/:containerId/shares',
  getGroupMemberPermissions,
  addErrorHandling(CONTAINER_ERRORS.SHARES_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const result = await getSharesForContainer(containerId);
    res.status(200).json({
      result,
    });
  })
);

/**
 * @openapi
 * /api/containers/{containerId}/shares/invitation/update:
 *   post:
 *     summary: Update invitation permissions for a container
 *     tags: [Containers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: containerId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               invitationId:
 *                 type: integer
 *               permission:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Invitation permissions updated successfully
 *       400:
 *         description: Failed to update invitation permissions
 */
// Update invitation permissions for a container
router.post(
  '/:containerId/shares/invitation/update',
  getGroupMemberPermissions,
  addErrorHandling(CONTAINER_ERRORS.PERMISSIONS_NOT_UPDATED),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const { userId, invitationId, permission } = req.body; // TODO: get from session

    const result = await updateInvitationPermissions(
      containerId,
      parseInt(invitationId),
      userId,
      parseInt(permission)
    );
    res.status(200).json({
      result,
    });
  })
);

/**
 * @openapi
 * /api/containers/{containerId}/shares/accessLink/update:
 *   post:
 *     summary: Update access link permissions for a container
 *     tags: [Containers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: containerId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               accessLinkId:
 *                 type: integer
 *               permission:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Access link permissions updated successfully
 *       400:
 *         description: Failed to update access link permissions
 */
// Update access link permissions for a container
router.post(
  '/:containerId/shares/accessLink/update',
  getGroupMemberPermissions,
  addErrorHandling(CONTAINER_ERRORS.PERMISSIONS_NOT_UPDATED),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const { userId, accessLinkId, permission } = req.body; // TODO: get from session
    const result = await updateAccessLinkPermissions(
      containerId,
      accessLinkId,
      userId,
      parseInt(permission)
    );
    res.status(200).json({
      result,
    });
  })
);

export default router;
