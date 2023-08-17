import { Prisma, ContainerType } from '@prisma/client';
import { Router } from 'express';
import {
  createUser,
  createEphemeralLink,
  getEphemeralLinkChallenge,
  acceptEphemeralLink,
} from '../models';

const router: Router = Router();

// request a hash for an ephemeral user
router.post('/', async (req, res) => {
  const {
    containerId,
    wrappedKey,
    senderId,
    salt,
    challengeCiphertext,
    challengePlaintext,
  }: {
    containerId: number;
    wrappedKey: string;
    senderId: number;
    salt: string;
    challengeCiphertext: string;
    challengePlaintext: string;
  } = req.body;
  try {
    const ephemeralLink = await createEphemeralLink(
      containerId,
      wrappedKey,
      senderId,
      salt,
      challengeCiphertext,
      challengePlaintext
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

// get the challenge info
router.get('/:hash/challenge', async (req, res) => {
  const { hash } = req.params;
  if (!hash) {
    res.status(400).json({
      message: 'Cannot create ephemeral user without hash',
    });
  }
  try {
    const data = await getEphemeralLinkChallenge(hash);
    res.status(200).json({
      ...data,
    });
  } catch (e) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

// activate the hash for an ephemeral user
// if the challenge is correct
router.post('/:hash/challenge', async (req, res) => {
  const { hash } = req.params;
  const { challengePlaintext } = req.body;
  if (!hash) {
    res.status(400).json({
      message: 'Cannot create ephemeral user without hash',
    });
  }
  try {
    const link = await acceptEphemeralLink(hash, challengePlaintext);
    if (link) {
      res.status(200).json({
        status:
          'I guess I should create a user for you and put info here or something',
      });
    } else {
      res.status(400).json({});
    }
  } catch (e) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

export default router;
