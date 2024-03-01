import { Prisma, ContainerType } from '@prisma/client';
import { Router } from 'express';
import {
  getOwnedContainers,
  createItem,
  deleteItem,
  addGroupMember,
  removeGroupMember,
  acceptInvitation,
  getContainerInfo,
  getContainerWithMembers,
  getSharesForContainer,
  updateInvitationPermissions,
  updateAccessLinkPermissions,
  removeInvitationAndGroup,
  updateItemName,
  getContainerWithDescendants,
} from '../models';

import {
  requireLogin,
  renameBodyProperty,
  getPermissions,
  canWrite,
  canRead,
  canAdmin,
} from '../middleware';

import { createInvitation, burnFolder } from '../models/sharing';

import {
  createContainer,
  updateContainerName,
  getItemsInContainer,
  getContainerWithAncestors,
  getAccessLinksForContainer,
} from '../models/containers';

const router: Router = Router();

type TreeNode = {
  id: number;
  children: Record<string, any>[];
};

function flattenDescendants(tree: TreeNode) {
  const children = tree?.children.length > 0 ? tree.children : [];
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
  getPermissions,
  canRead,
  async (req, res) => {
    const { containerId } = req.params;
    try {
      const container = await getItemsInContainer(parseInt(containerId));

      if (container.parentId) {
        container['parent'] = await getContainerWithAncestors(
          container.parentId
        );
      }

      res.status(200).json(container);
    } catch (error) {
      res.status(500).json({
        message: 'Server error.',
      });
    }
  }
);

// Get all Access Links for a container
router.get(
  '/:containerId/links',
  requireLogin,
  getPermissions,
  canRead,
  async (req, res) => {
    const { containerId } = req.params;
    try {
      const links = await getAccessLinksForContainer(parseInt(containerId));
      res.status(200).json(links);
    } catch (error) {
      res.status(500).json({
        message: 'Server error.',
      });
    }
  }
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
  getPermissions,
  canWrite,
  async (req, res) => {
    const {
      name,
      type,
    }: {
      name: string;
      type: ContainerType;
    } = req.body;

    const ownerId = req.session.user.id;

    let shareOnly = false;
    if (req.body.shareOnly) {
      shareOnly = req.body.shareOnly;
    }

    let parentId = 0;
    if (req.body.containerId) {
      parentId = req.body.containerId;
    }

    const messagesByCode: Record<string, string> = {
      P2002: 'Container already exists',
      // P2003: 'User does not exist',
      // Can't use P2003, it's a generic foreign-key error
    };

    const defaultMessage = 'Bad request';

    try {
      const container = await createContainer(
        name.trim().toLowerCase(),
        ownerId,
        type,
        parentId,
        shareOnly
      );
      res.status(201).json({
        message: 'Container created',
        container,
      });
    } catch (error) {
      console.log(`🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎`);
      console.log(error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        res.status(400).json({
          message: messagesByCode[error.code] || defaultMessage,
        });
      } else {
        console.log(error);
        res.status(500).json({
          message: 'Server error.',
        });
      }
    }
  }
);

// Rename a container
router.post(
  '/:containerId/rename',
  requireLogin,
  getPermissions,
  canWrite,
  async (req, res) => {
    const { containerId } = req.params;
    const { name } = req.body;

    try {
      const container = await updateContainerName(parseInt(containerId), name);
      res.status(200).json(container);
    } catch (error) {
      res.status(500).json({
        message: 'Server error.',
      });
    }
  }
);

// TODO: think about whether we can be admin of a folder that contains folders we don't own.
router.delete(
  '/:containerId',
  requireLogin,
  getPermissions,
  canAdmin,
  async (req, res) => {
    const { containerId } = req.params;
    try {
      const root = await getContainerWithDescendants(parseInt(containerId));
      const idArray = flattenDescendants(root);
      const result = await Promise.all(
        idArray.map(async (id: number) => await burnFolder(id))
      );
      res.status(200).json({
        result,
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({
        message: 'Server error',
      });
    }
  }
);
// everything above this line is confirmed for q1-dogfood use
// ==================================================================================

router.get('/', (req, res) => {
  res.status(200).send('hey from container router');
});

router.get('/owner/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const containers = await getOwnedContainers(parseInt(userId));
    res.status(200).json(containers);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

// Add an Item
router.post('/:containerId/item', getPermissions, async (req, res) => {
  const { containerId } = req.params;
  const { name, uploadId, type, wrappedKey } = req.body;
  try {
    const item = await createItem(
      name,
      parseInt(containerId),
      uploadId,
      type,
      wrappedKey
    );
    res.status(200).json(item);
    console.log(`just returned item as json for item create`);
    console.log(item);
  } catch (error) {
    console.log(error);
    console.log(`🤡 why did it not create the item?`);
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

router.delete(
  '/:containerId/item/:itemId',
  getPermissions,
  async (req, res) => {
    const { containerId, itemId } = req.params;
    // Force req.body.shouldDeleteUpload to a boolean
    const shouldDeleteUpload = !!req.body.shouldDeleteUpload;
    try {
      const result = await deleteItem(parseInt(itemId), shouldDeleteUpload);
      res.status(200).json(result);
    } catch (error) {
      console.log(`error deleting item ${itemId} in container ${containerId}`);
      console.log(error);
      res.status(500).json({
        message: 'Server error.',
      });
    }
  }
);

router.post(
  '/:containerId/item/:itemId/rename',
  getPermissions,
  async (req, res) => {
    const { containerId, itemId } = req.params;
    const { name } = req.body;
    try {
      const item = await updateItemName(parseInt(itemId), name);
      res.status(200).json(item);
    } catch (error) {
      res.status(500).json({
        message: 'Server error.',
      });
    }
  }
);

router.post('/:containerId/member/invite', getPermissions, async (req, res) => {
  const { containerId } = req.params;
  const { senderId, recipientId, wrappedKey } = req.body;
  let permission = '0';
  if (req.body.permission) {
    permission = req.body.permission;
  }
  try {
    const invitation = await createInvitation(
      parseInt(containerId),
      wrappedKey,
      parseInt(senderId),
      parseInt(recipientId),
      parseInt(permission)
    );
    res.status(200).json(invitation);
  } catch (error) {
    console.log(`🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡`);
    console.log(error);
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

router.post('/:containerId/member/accept/:invitationId', async (req, res) => {
  const { invitationId } = req.params;
  try {
    const result = await acceptInvitation(parseInt(invitationId));
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

// Remove invitation and group membership
router.delete('/:containerId/member/remove/:invitationId', async (req, res) => {
  const { invitationId } = req.params;
  try {
    const result = await removeInvitationAndGroup(parseInt(invitationId));
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

// Add member to access group for container
router.post('/:containerId/member', getPermissions, async (req, res) => {
  const { containerId } = req.params;
  const { userId } = req.body;
  try {
    const container = await addGroupMember(
      parseInt(containerId),
      parseInt(userId)
    );
    res.status(200).json(container);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

// Remove member from access group for container
router.delete(
  '/:containerId/member/:userId',
  getPermissions,
  async (req, res) => {
    const { containerId, userId } = req.params;
    try {
      const container = await removeGroupMember(
        parseInt(containerId),
        parseInt(userId)
      );
      res.status(200).json(container);
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: 'Server error.',
      });
    }
  }
);

// Get all members for a container
router.get('/:containerId/members', getPermissions, async (req, res) => {
  // getContainerWithMembers
  const { containerId } = req.params;
  try {
    const { group } = await getContainerWithMembers(parseInt(containerId));
    res.status(200).json(group.members);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

// Get container info
router.get('/:containerId/info', getPermissions, async (req, res) => {
  const { containerId } = req.params;
  try {
    const container = await getContainerInfo(parseInt(containerId));
    res.status(200).json(container);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

router.get('/:containerId/shares', getPermissions, async (req, res) => {
  const { containerId } = req.params;
  const { userId } = req.body; // TODO: get from session
  try {
    const result = await getSharesForContainer(
      parseInt(containerId),
      parseInt(userId)
    );
    res.status(200).json({
      result,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: 'Server error',
    });
  }
});

router.post(
  '/:containerId/shares/invitation/update',
  getPermissions,
  async (req, res) => {
    const { containerId } = req.params;
    const { userId, invitationId, permission } = req.body; // TODO: get from session
    console.log(req.body);
    console.log(`🤡 invitationId`, invitationId);
    try {
      const result = await updateInvitationPermissions(
        parseInt(containerId),
        parseInt(invitationId),
        parseInt(userId),
        parseInt(permission)
      );
      res.status(200).json({
        result,
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({
        message: 'Server error',
      });
    }
  }
);
router.post(
  '/:containerId/shares/accessLink/update',
  getPermissions,
  async (req, res) => {
    const { containerId } = req.params;
    const { userId, accessLinkId, permission } = req.body; // TODO: get from session

    try {
      const result = await updateAccessLinkPermissions(
        parseInt(containerId),
        accessLinkId,
        parseInt(userId),
        parseInt(permission)
      );
      res.status(200).json({
        result,
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({
        message: 'Server error',
      });
    }
  }
);

export default router;
