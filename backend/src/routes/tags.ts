import { Prisma, ContainerType, UserTier } from '@prisma/client';
import { Router } from 'express';
import {
  createTagForItem,
  createTagForContainer,
  deleteTag,
  updateTagName,
  getContainersAndItemsWithTags,
} from '../models';
import { getGroupMemberPermissions, requireLogin } from '../middleware';
import { asyncHandler, onError } from '../errors/routes';

const router: Router = Router();

router.post(
  '/item/:itemId/',
  onError(500, 'Could not create tag'),
  asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { name, color } = req.body;
    const tag = await createTagForItem(name, color, parseInt(itemId));
    res.status(200).json(tag);
  })
);

router.post(
  '/container/:containerId/',
  onError(500, 'Could not create tag'),
  asyncHandler(async (req, res) => {
    const { containerId } = req.params;
    const { name, color } = req.body;
    const tag = await createTagForContainer(name, color, parseInt(containerId));
    res.status(200).json(tag);
  })
);

router.delete(
  '/:tagId',
  onError(500, 'Could not delete tag'),
  asyncHandler(async (req, res) => {
    const { tagId } = req.params;
    const result = await deleteTag(parseInt(tagId));
    res.status(200).json(result);
  })
);

router.post(
  '/:tagId/rename',
  onError(500, 'Could not rename tag'),
  asyncHandler(async (req, res) => {
    const { tagId } = req.params;
    const { name } = req.body;
    const tag = await updateTagName(parseInt(tagId), name);
    res.status(200).json(tag);
  })
);

// Get all the items and containers with a particular tag
router.get(
  '/:tagName',
  requireLogin,
  getGroupMemberPermissions,
  onError(404, 'Could not find tag'),
  asyncHandler(async (req, res) => {
    const { tagName } = req.params;
    const { id } = req.session.user;
    const result = await getContainersAndItemsWithTags(id, [tagName]);
    res.status(200).json({
      ...result,
    });
  })
);

export default router;
