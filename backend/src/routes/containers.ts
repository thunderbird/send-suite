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
  updateAccessLinkPermissions,
  updateInvitationPermissions,
  updateItemName,
} from '../models';

import {
  getGroupMemberPermissions,
  renameBodyProperty,
  requireAdminPermission,
  requireLogin,
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
import { getSessionUserOrThrow } from '../utils/session';

const router: Router = Router();

export type TreeNode = {
  id: number;
  children: TreeNode[] | [];
};

export function flattenDescendants(tree: TreeNode): number[] {
  if (!tree || !tree.id) {
    return [];
  }
  const children = tree?.children?.length > 0 ? tree.children : [];
  return [
    ...children.flatMap((child: TreeNode) => flattenDescendants(child)),
    tree.id,
  ];
}

// Get a container and its items
// Add the ancestor folder path as a property.
router.get(
  '/:containerId',
  requireLogin,
  getGroupMemberPermissions,
  requireReadPermission,
  addErrorHandling(CONTAINER_ERRORS.CONTAINER_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const container = await getItemsInContainer(parseInt(containerId));

    if (!container) {
      throw new Error();
    }

    if (container.parentId) {
      container['parent'] = await getContainerWithAncestors(container.parentId);
    }

    res.status(200).json(container);
  })
);

// Get all Access Links for a container
router.get(
  '/:containerId/links',
  requireLogin,
  getGroupMemberPermissions,
  requireReadPermission,
  addErrorHandling(CONTAINER_ERRORS.ACCESS_LINKS_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const links = await getAccessLinksForContainer(parseInt(containerId));
    res.status(200).json(links);
  })
);

// Create a container
// When creating a subfolder in Lockbox, the front-end will pass in the parent folder id
// as `req.body.parentId`. But, to use `getPermissions`, we need to rename that property
// to `req.body.containerId`.
// `renameBodyProperty` is a no-op when creating a top-level folder in Lockbox.
router.post(
  '/',
  requireLogin,
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

    const { id } = getSessionUserOrThrow(req);

    const ownerId = id;

    let shareOnly = false;
    if (req.body.shareOnly) {
      shareOnly = req.body.shareOnly;
    }

    let parentId = 0;
    if (req.body.containerId) {
      parentId = req.body.containerId;
    }

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

// Rename a container
router.post(
  '/:containerId/rename',
  requireLogin,
  getGroupMemberPermissions,
  requireWritePermission,
  addErrorHandling(CONTAINER_ERRORS.CONTAINER_NOT_RENAMED),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const { name } = req.body;
    const container = await updateContainerName(parseInt(containerId), name);
    res.status(200).json(container);
  })
);

// TODO: think about whether we can be admin of a folder that contains folders we don't own.
router.delete(
  '/:containerId',
  requireLogin,
  getGroupMemberPermissions,
  requireAdminPermission,
  addErrorHandling(CONTAINER_ERRORS.CONTAINER_NOT_DELETED),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const root = await getContainerWithDescendants(parseInt(containerId));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const idArray = flattenDescendants(root as any);

    const burnPromises = idArray.map((id: number) =>
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
      parseInt(containerId),
      uploadId,
      type,
      wrappedKey
    );
    res.status(200).json(item);
  })
);

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
      parseInt(containerId),
      wrappedKey,
      parseInt(senderId),
      parseInt(recipientId),
      parseInt(permission)
    );
    res.status(200).json(invitation);
  })
);

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

// Add member to access group for container
router.post(
  '/:containerId/member',
  getGroupMemberPermissions,
  addErrorHandling(CONTAINER_ERRORS.MEMBER_NOT_CREATED),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const { userId } = req.body;
    const container = await addGroupMember(
      parseInt(containerId),
      parseInt(userId)
    );
    res.status(200).json(container);
  })
);

// Remove member from access group for container
router.delete(
  '/:containerId/member/:userId',
  getGroupMemberPermissions,
  addErrorHandling(CONTAINER_ERRORS.MEMBER_NOT_DELETED),
  wrapAsyncHandler(async (req, res) => {
    const { containerId, userId } = req.params;
    const container = await removeGroupMember(
      parseInt(containerId),
      parseInt(userId)
    );
    res.status(200).json(container);
  })
);

// Get all members for a container
router.get(
  '/:containerId/members',
  getGroupMemberPermissions,
  addErrorHandling(CONTAINER_ERRORS.MEMBERS_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    // getContainerWithMembers
    const { containerId } = req.params;
    const { group } = await getContainerWithMembers(parseInt(containerId));
    res.status(200).json(group.members);
  })
);

// Get container info
router.get(
  '/:containerId/info',
  getGroupMemberPermissions,
  addErrorHandling(CONTAINER_ERRORS.INFO_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const container = await getContainerInfo(parseInt(containerId));
    res.status(200).json(container);
  })
);

router.get(
  '/:containerId/shares',
  getGroupMemberPermissions,
  addErrorHandling(CONTAINER_ERRORS.SHARES_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    // const { userId } = req.body; // TODO: get from session
    const result = await getSharesForContainer(
      parseInt(containerId)
      // parseInt(userId)
    );
    res.status(200).json({
      result,
    });
  })
);

router.post(
  '/:containerId/shares/invitation/update',
  getGroupMemberPermissions,
  addErrorHandling(CONTAINER_ERRORS.PERMISSIONS_NOT_UPDATED),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const { userId, invitationId, permission } = req.body; // TODO: get from session

    const result = await updateInvitationPermissions(
      parseInt(containerId),
      parseInt(invitationId),
      parseInt(userId),
      parseInt(permission)
    );
    res.status(200).json({
      result,
    });
  })
);
router.post(
  '/:containerId/shares/accessLink/update',
  getGroupMemberPermissions,
  addErrorHandling(CONTAINER_ERRORS.PERMISSIONS_NOT_UPDATED),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const { userId, accessLinkId, permission } = req.body; // TODO: get from session
    const result = await updateAccessLinkPermissions(
      parseInt(containerId),
      accessLinkId,
      parseInt(userId),
      parseInt(permission)
    );
    res.status(200).json({
      result,
    });
  })
);

export default router;
