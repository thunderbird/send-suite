import { Prisma, ContainerType } from '@prisma/client';
import { Router } from 'express';
import {
  burnEphemeralConversation,
  createAccessLink,
  getAccessLinkChallenge,
  acceptAccessLink,
} from '../models';

const router: Router = Router();

// request a hash for an ephemeral user
router.post('/', async (req, res) => {
  const {
    containerId,
    senderId,
    wrappedKey,
    salt,
    challengeKey,
    challengeSalt,
    challengeCiphertext,
    challengePlaintext,
  }: {
    containerId: number;
    senderId: number;
    wrappedKey: string;
    salt: string;
    challengeKey: string;
    challengeSalt: string;
    challengeCiphertext: string;
    challengePlaintext: string;
  } = req.body;
  let permission = '0';
  if (req.body.permission) {
    permission = req.body.permission;
  }
  try {
    const ephemeralLink = await createAccessLink(
      containerId,
      senderId,
      wrappedKey,
      salt,
      challengeKey,
      challengeSalt,
      challengeCiphertext,
      challengePlaintext,
      parseInt(permission)
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
    const { challengeKey, challengeSalt, challengeCiphertext } =
      await getAccessLinkChallenge(hash);
    res.status(200).json({
      challengeKey,
      challengeSalt,
      challengeCiphertext,
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
    const link = await acceptAccessLink(hash, challengePlaintext);
    if (link) {
      // console.log(link);
      console.log(
        `challenge success, sending back the containerId, wrappedKey, and salt`
      );
      const { share, wrappedKey, salt } = link;
      res.status(200).json({
        status: 'success',
        containerId: share.containerId,
        wrappedKey,
        salt,
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

router.post('/burn', async (req, res) => {
  const { containerId } = req.body;
  console.log(`👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿`);
  try {
    const result = await burnEphemeralConversation(parseInt(containerId));
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
