import { Prisma, ContainerType, UserTier } from '@prisma/client';
import { Router } from 'express';
import {
  createTagForItem,
  createTagForContainer,
  deleteTag,
  updateTagName,
  getContainersAndItemsWithTags,
} from '../models';
import { getGroupMemberPermissions } from '../middleware';

const router: Router = Router();

router.post('/item/:itemId/', async (req, res) => {
  const { itemId } = req.params;
  const { name, color } = req.body;
  try {
    const tag = await createTagForItem(name, color, parseInt(itemId));
    res.status(200).json(tag);
  } catch (e) {
    res.status(500).json({
      message: 'Server error.',
    });
    console.log(e);
  }
});

router.post('/container/:containerId/', async (req, res) => {
  const { containerId } = req.params;
  const { name, color } = req.body;
  try {
    const tag = await createTagForContainer(name, color, parseInt(containerId));
    res.status(200).json(tag);
  } catch (e) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

router.delete('/:tagId', async (req, res) => {
  const { tagId } = req.params;
  try {
    const result = await deleteTag(parseInt(tagId));
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

router.post('/:tagId/rename', async (req, res) => {
  const { tagId } = req.params;
  const { name } = req.body;
  try {
    const tag = await updateTagName(parseInt(tagId), name);
    res.status(200).json(tag);
  } catch (e) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

// Get all the items and containers with a particular tag
router.get('/:tagName', getGroupMemberPermissions, async (req, res) => {
  const { tagName } = req.params;
  // const userId = req?.session?.user?.id;
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({
      message: 'No user session.',
      // error: error.message,
    });
    return;
  }

  try {
    const result = await getContainersAndItemsWithTags(userId, [tagName]);
    if (!result) {
      res.status(500).json({
        message: 'Server error.',
      });
    }

    res.status(200).json({
      ...result,
    });
  } catch (e) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

export default router;
