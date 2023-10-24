import { Prisma, ContainerType } from '@prisma/client';
import { Router } from 'express';
import {
  createContainer,
  getOwnedContainers,
  createItem,
  deleteItem,
  getItemsInContainer,
  addGroupMember,
  removeGroupMember,
  createInvitation,
  acceptInvitation,
  getContainerInfo,
  burnFolder,
  getContainerWithMembers,
} from '../models';
import { getPermissions } from '../middleware';

const router: Router = Router();

router.get('/', (req, res) => {
  res.status(200).send('hey from container router');
});

router.post('/', async (req, res) => {
  const {
    name,
    // publicKey,
    ownerId,
    type,
  }: {
    name: string;
    // publicKey: string;
    ownerId: number;
    type: ContainerType;
  } = req.body;

  let shareOnly = false;
  if (req.body.shareOnly) {
    shareOnly = req.body.shareOnly;
  }

  const messagesByCode: Record<string, string> = {
    P2002: 'Container already exists',
    P2003: 'User does not exist',
  };

  const defaultMessage = 'Bad request';

  try {
    const container = await createContainer(
      name.trim().toLowerCase(),
      // publicKey.trim(),
      ownerId,
      type,
      shareOnly
    );
    res.status(201).json({
      message: 'Container created',
      container,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(400).json({
        message: messagesByCode[error.code] || defaultMessage,
      });
    } else {
      console.log(error);
      res.status(500).json({
        message: 'Server error.',
        // error: error.message,
      });
    }
  }
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
router.post('/:containerId', getPermissions, async (req, res) => {
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

router.post('/:containerId/member/invite', getPermissions, async (req, res) => {
  const { containerId } = req.params;
  const { userId, recipientId, wrappedKey } = req.body;
  let permission = '0';
  if (req.body.permission) {
    permission = req.body.permission;
  }
  try {
    const invitation = await createInvitation(
      parseInt(containerId),
      wrappedKey,
      parseInt(userId),
      parseInt(recipientId),
      parseInt(permission)
    );
    res.status(200).json(invitation);
  } catch (error) {
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

// Get a container and its items
router.get('/:containerId', getPermissions, async (req, res) => {
  const { containerId } = req.params;
  try {
    const containerWithItems = await getItemsInContainer(parseInt(containerId));
    res.status(200).json(containerWithItems);
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

router.delete('/:containerId', getPermissions, async (req, res) => {
  const { containerId } = req.params;
  console.log(`👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿`);
  try {
    const result = await burnFolder(parseInt(containerId));
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

export default router;
