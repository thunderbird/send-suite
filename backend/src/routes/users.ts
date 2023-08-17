import { Prisma, ContainerType } from '@prisma/client';
import { Router } from 'express';
import {
  createUser,
  getAllUserGroupContainers,
  getUserPublicKey,
  getAllInvitations,
} from '../models';

const router: Router = Router();

router.get('/', (req, res) => {
  res.status(200).send('hey from user router');
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await getUserPublicKey(parseInt(id));
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

router.post('/', async (req, res) => {
  const {
    email,
    publicKey,
  }: {
    email: string;
    publicKey: string;
  } = req.body;
  console.log(email);
  console.log(typeof publicKey);

  try {
    const user = await createUser(
      email.trim().toLowerCase(),
      JSON.stringify(publicKey).trim()
    );
    res.status(201).json({
      message: 'User created',
      user,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      res.status(400).json({
        message: 'User already exists',
      });
    } else {
      res.status(500).json({
        message: 'Server error.',
        // error: error.message,
      });
    }
  }
});

// All containers, regardless of type
router.get('/:userId/containers', async (req, res) => {
  const { userId } = req.params;
  try {
    const containers = await getAllUserGroupContainers(parseInt(userId), null);
    res.status(200).json(containers);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

router.get('/:userId/conversations', async (req, res) => {
  const { userId } = req.params;
  try {
    const containers = await getAllUserGroupContainers(
      parseInt(userId),
      ContainerType.CONVERSATION
    );
    res.status(200).json(containers);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

router.get('/:userId/folders', async (req, res) => {
  const { userId } = req.params;
  try {
    const containers = await getAllUserGroupContainers(
      parseInt(userId),
      ContainerType.FOLDER
    );
    res.status(200).json(containers);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

router.get('/:userId/invitations', async (req, res) => {
  const { userId } = req.params;
  try {
    const invitations = await getAllInvitations(parseInt(userId));
    res.status(200).json(invitations);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

export default router;
