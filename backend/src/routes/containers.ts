import { Prisma, ContainerType } from '@prisma/client';
import { Router } from 'express';
import {
  createContainer,
  getOwnedContainers,
  createItem,
  getItemsInContainer,
  addGroupMember,
  removeGroupMember,
  shareKeyWithGroupMember,
  acceptInvitation,
} from '../models';

const router: Router = Router();

router.get('/', (req, res) => {
  res.status(200).send('hey from container router');
});

router.post('/', async (req, res) => {
  const {
    name,
    publicKey,
    ownerId,
    type,
  }: {
    name: string;
    publicKey: string;
    ownerId: number;
    type: ContainerType;
  } = req.body;

  const messagesByCode: Record<string, string> = {
    P2002: 'Container already exists',
    P2003: 'User does not exist',
  };

  const defaultMessage = 'Bad request';

  console.log(typeof name);
  console.log(`🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡`);
  try {
    const container = await createContainer(
      name.trim().toLowerCase(),
      publicKey.trim(),
      ownerId,
      type
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

router.post('/:containerId', async (req, res) => {
  const { containerId } = req.params;
  const { name, uploadId, type } = req.body;
  try {
    const item = await createItem(name, parseInt(containerId), uploadId, type);
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

// Add member to access group for container
router.post('/:containerId/member', async (req, res) => {
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

router.post('/:containerId/member/sharekey', async (req, res) => {
  const { containerId } = req.params;
  const { userId, senderId, wrappedKey } = req.body;
  try {
    const invitation = await shareKeyWithGroupMember(
      parseInt(containerId),
      wrappedKey,
      parseInt(userId),
      parseInt(senderId)
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
router.post('/:containerId/member', async (req, res) => {
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
router.delete('/:containerId/member', async (req, res) => {
  const { containerId } = req.params;
  const { userId } = req.body;
  try {
    const container = await removeGroupMember(
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

// Get a container and its items
router.get('/:containerId', async (req, res) => {
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

export default router;
