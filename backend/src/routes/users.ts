import { Prisma, ContainerType, UserTier } from '@prisma/client';
import { Router } from 'express';
import {
  createUser,
  getAllUserGroupContainers,
  getUserPublicKey,
  getAllInvitations,
  getUserByEmail,
  getContainersSharedByMe,
  getContainersSharedWithMe,
  getRecentActivity,
  getBackup,
  setBackup,
} from '../models';

const router: Router = Router();

// TODO: shift userId to session and out of req.params

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

router.get('/lookup/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await getUserByEmail(email);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

router.post('/login', async (req, res) => {
  const { email } = req.body;
  console.log(`looking for user ${email}`);
  try {
    const user = await getUserByEmail(email);
    if (user) {
      console.log(`Adding logged-in user to request object`);
      req.session.user = user;
      req.session.save((err) => {
        if (err) {
          console.log(`💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣`);
          console.log(`couldn't save session`);
          res.status(500).json(err);
        } else {
          res.status(200).json(user);
        }
      });
    } else {
      res.status(404).send();
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: 'Server error.',
      error: error.message,
    });
  }
});

router.post('/', async (req, res) => {
  const {
    publicKey,
    email,
    tier,
  }: {
    publicKey: string;
    email: string;
    tier: UserTier | null;
  } = req.body;
  console.log(email);
  console.log(typeof publicKey);
  let userEmail = email;
  if (email) {
    userEmail = email.trim().toLowerCase();
  }
  try {
    const user = await createUser(
      JSON.stringify(publicKey).trim(),
      userEmail,
      tier
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
    console.log(`🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡`);
    console.log(error);
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

router.get('/:userId/activity', async (req, res) => {
  const { userId } = req.params;
  try {
    const containers = await getRecentActivity(
      parseInt(userId),
      ContainerType.FOLDER
    );
    res.status(200).json(containers);
  } catch (error) {
    console.log(`🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡`);
    console.log(error);
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

router.get('/:userId/folders/sharedByMe', async (req, res) => {
  const { userId } = req.params;
  try {
    const containersAndMembers = await getContainersSharedByMe(
      parseInt(userId),
      ContainerType.FOLDER
    );

    res.status(200).json(containersAndMembers);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

router.get('/:userId/folders/sharedWithMe', async (req, res) => {
  const { userId } = req.params;
  try {
    const containersAndMembers = await getContainersSharedWithMe(
      parseInt(userId),
      ContainerType.FOLDER
    );

    res.status(200).json(containersAndMembers);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

// Get invitations for user
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

router.post('/:id/backup', async (req, res) => {
  const { id } = req.params;
  const { keys, keypair, keystring, salt } = req.body;
  try {
    const user = await setBackup(parseInt(id), keys, keypair, keystring, salt);
    res.status(200).json({
      message: 'backup complete',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Server error.',
    });
  }
});
router.get('/:id/backup', async (req, res) => {
  const { id } = req.params;
  try {
    const backup = await getBackup(parseInt(id));
    res.status(200).json(backup);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

export default router;
