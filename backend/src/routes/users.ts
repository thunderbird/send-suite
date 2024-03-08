import { Prisma, ContainerType, UserTier } from '@prisma/client';

import { Router } from 'express';

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

const router: Router = Router();

router.get('/me', requireLogin, async (req, res) => {
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
});

router.get('/publickey/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await getUserPublicKey(id);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

// Update user's public key
// TODO: decide whether this should just be a "profile update" function
// that can take any of the following: email, publicKey, avatar...
router.post('/publickey', requireLogin, async (req, res) => {
  const {
    publicKey,
  }: {
    publicKey: string;
  } = req.body;

  const { id } = req.session.user;

  try {
    const update = await updateUserPublicKey(
      id,
      JSON.stringify(publicKey).trim()
    );
    res.status(200).json({
      update,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Could not update user public key',
    });
  }
});

router.get('/folders', requireLogin, async (req, res) => {
  const { id } = req.session.user;
  try {
    const containers = await getAllUserGroupContainers(
      id,
      ContainerType.FOLDER
    );
    res.status(200).json(containers);
  } catch (error) {
    console.log(`🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡`);
    console.log(error);
    res.status(500).json({
      message: 'Could not retrieve user folders.',
    });
  }
});

// everything above this line is confirmed for q1-dogfood use
// ==================================================================================

// TODO: shift userId to session and out of req.params

router.get('/', (req, res) => {
  res.status(200).send('hey from user router');
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
    const containers = await getAllUserGroupContainers(userId, null);
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
      userId,
      ContainerType.CONVERSATION
    );
    res.status(200).json(containers);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

router.get('/:userId/activity', async (req, res) => {
  const { userId } = req.params;
  try {
    const containers = await getRecentActivity(userId, ContainerType.FOLDER);
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
      userId,
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
      userId,
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
    const invitations = await getAllInvitations(userId);
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
    const user = await setBackup(id, keys, keypair, keystring, salt);
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
    const backup = await getBackup(id);
    res.status(200).json(backup);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

export default router;
