import { Router } from 'express';

import {
  acceptAccessLink,
  acceptInvitation,
  burnEphemeralConversation,
  createAccessLink,
  createInvitationFromAccessLink,
  getAccessLinkChallenge,
  getContainerForAccessLink,
  isAccessLinkValid,
  removeAccessLink,
} from '../models/sharing';

import {
  addErrorHandling,
  SHARING_ERRORS,
  wrapAsyncHandler,
} from '../errors/routes';

import {
  getGroupMemberPermissions,
  requireLogin,
  requireSharePermission,
} from '../middleware';
import { validSessionOrThrow } from '../utils/session';

const router: Router = Router();

// Request a new hash for a shared container
router.post(
  '/',
  requireLogin,
  getGroupMemberPermissions,
  requireSharePermission,
  addErrorHandling(SHARING_ERRORS.ACCESS_LINK_NOT_CREATED),
  wrapAsyncHandler(async (req, res) => {
    const {
      containerId,
      senderId,
      wrappedKey,
      salt,
      challengeKey,
      challengeSalt,
      challengeCiphertext,
      challengePlaintext,
      expiration,
    }: {
      containerId: number;
      senderId: number;
      wrappedKey: string;
      salt: string;
      challengeKey: string;
      challengeSalt: string;
      challengeCiphertext: string;
      challengePlaintext: string;
      expiration: string;
    } = req.body;
    let permission = '0';
    if (req.body.permission) {
      permission = req.body.permission;
    }
    const accessLink = await createAccessLink(
      containerId,
      senderId,
      wrappedKey,
      salt,
      challengeKey,
      challengeSalt,
      challengeCiphertext,
      challengePlaintext,
      parseInt(permission),
      expiration
    );

    res.status(200).json({
      id: accessLink.id,
      expiryDate: accessLink.expiryDate,
    });
  })
);

// Get the challenge for this hash
router.get(
  '/:linkId/challenge',
  addErrorHandling(SHARING_ERRORS.CHALLENGE_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { linkId } = req.params;
    if (!linkId) {
      res.status(400).json({
        message: 'linkId is required',
      });
    }
    const { challengeKey, challengeSalt, challengeCiphertext } =
      await getAccessLinkChallenge(linkId);
    res.status(200).json({
      challengeKey,
      challengeSalt,
      challengeCiphertext,
    });
  })
);

// Respond to the challenge.
// If plaintext matches, we respond with wrapped key
// associated salt
router.post(
  '/:linkId/challenge',
  addErrorHandling(SHARING_ERRORS.CHALLENGE_FAILED),
  wrapAsyncHandler(async (req, res) => {
    const { linkId } = req.params;
    const { challengePlaintext } = req.body;

    const link = await acceptAccessLink(linkId, challengePlaintext);
    const { share, wrappedKey, salt } = link;
    res.status(200).json({
      status: 'success',
      containerId: share.containerId,
      wrappedKey,
      salt,
    });
  })
);

// Get an AccessLink's container and items
router.get(
  '/exists/:linkId',
  addErrorHandling(SHARING_ERRORS.ACCESS_LINK_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { linkId } = req.params;
    res.status(200).json(await isAccessLinkValid(linkId));
  })
);

// Get an AccessLink's container and items
/*
If I want to protect this with permissions, I'd need to:
- not require a login
- get the permissions off of the access link (which points to a share, which points to a container)
- confirm it canRead
*/
router.get(
  '/:linkId',
  addErrorHandling(SHARING_ERRORS.CONTAINER_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { linkId } = req.params;
    const containerWithItems = await getContainerForAccessLink(linkId);
    res.status(200).json(containerWithItems);
  })
);

// Remove accessLink
router.delete(
  '/:linkId',
  addErrorHandling(SHARING_ERRORS.ACCESS_LINK_NOT_DELETED),
  wrapAsyncHandler(async (req, res) => {
    const { linkId } = req.params;
    const result = await removeAccessLink(linkId);
    res.status(200).json(result);
  })
);

// Allow user to use an AccessLink to become a group member for a container
router.post(
  '/:linkId/member/accept',
  requireLogin,
  addErrorHandling(SHARING_ERRORS.ACCESS_LINK_NOT_ACCEPTED),
  wrapAsyncHandler(async (req, res) => {
    validSessionOrThrow(req);

    const { linkId } = req.params;
    const { id } = req.session.user!;

    // We create an Invitation for two reasons:
    // - it allows us to reuse the existing `acceptInvitation()`
    // - it serves as record-keeping (e.g., we can prevent someone
    // from re-joining after their access has been revoked)
    const newInvitation = await createInvitationFromAccessLink(linkId, id);
    const result = await acceptInvitation(newInvitation.id);
    res.status(200).json(result);
  })
);

// Destroy a folder, its items, and any record of group memberships
router.post(
  '/burn',
  addErrorHandling(SHARING_ERRORS.NOT_BURNED),
  wrapAsyncHandler(async (req, res) => {
    const { containerId } = req.body;
    const result = await burnEphemeralConversation(parseInt(containerId));
    res.status(200).json({
      result,
    });
  })
);

export default router;
