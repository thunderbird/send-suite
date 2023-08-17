import { Prisma, ContainerType } from '@prisma/client';
import { Router } from 'express';
import { createUser, createEphemeralLink } from '../models';

const router: Router = Router();

// request a hash for an ephemeral user
router.post('/', async (req, res) => {
  const {
    containerId,
    wrappedKey,
    senderId,
    salt,
  }: {
    containerId: number;
    wrappedKey: string;
    senderId: number;
    salt: string;
  } = req.body;
  try {
    const ephemeralLink = await createEphemeralLink(
      containerId,
      wrappedKey,
      senderId,
      salt
    );

    res.status(200).json({
      id: ephemeralLink.id,
    });
  } catch (e) {
    res.status(500).json({
      message: 'Server error',
    });
  }
});

// activate the hash for an ephemeral user
router.post('/:hash', async (req, res) => {
  const { hash } = req.params;
  if (!hash) {
    res.status(400).json({
      message: 'Cannot create ephemeral user without hash',
    });
  }
  try {
    res.status(200).json({});
  } catch (e) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

export default router;
