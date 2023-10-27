import { Prisma, ContainerType } from '@prisma/client';
import { Router } from 'express';
import {
  burnEphemeralConversation,
  createAccessLink,
  getAccessLinkChallenge,
  acceptAccessLink,
  getContainerForAccessLinkHash,
  createInvitationForHash,
  removeAccessLink,
} from '../models';
import { getPermissions } from '../middleware';

const router: Router = Router();

// Request a new hash for a shared container,
// previously only used for "ephemeral chat"
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
    const accessLink = await createAccessLink(
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
      id: accessLink.id,
    });
  } catch (e) {
    res.status(500).json({
      message: 'Server error',
    });
  }
});

// Get the challenge for this hash
router.get('/:hash/challenge', async (req, res) => {
  const { hash } = req.params;
  if (!hash) {
    res.status(400).json({
      message: 'Hash is required',
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

// Respond to the challenge.
// If plaintext matches, we respond with wrapped key
// associated salt
router.post('/:hash/challenge', async (req, res) => {
  const { hash } = req.params;
  const { challengePlaintext } = req.body;
  if (!hash) {
    res.status(400).json({
      message: 'Hash is required',
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

// Get a container and its items
router.get('/:hash', getPermissions, async (req, res) => {
  const { hash } = req.params;

  try {
    // Get the containerId associated with the
    const containerWithItems = await getContainerForAccessLinkHash(hash);
    console.log(`here is the container with items:`);
    console.log(containerWithItems);
    res.status(200).json(containerWithItems);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

// Remove accessLink
router.delete('/:hash', async (req, res) => {
  const { hash } = req.params;
  try {
    const result = await removeAccessLink(hash);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

// For record keeping purposes, create a corresponding invitation
router.post(
  '/:hash/member/:recipientId/accept',
  getPermissions,
  async (req, res) => {
    const { hash, recipientId } = req.params;

    try {
      const result = await createInvitationForHash(hash, parseInt(recipientId));
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        message: 'Server error.',
      });
    }
  }
);

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
