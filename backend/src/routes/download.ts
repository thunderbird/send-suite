import { Router } from 'express';
// import {
//   createFolder,
//   getOwnedFolders,
//   createItem,
//   getItemsInFolder,
//   addGroupMember,
//   removeGroupMember,
// } from '../models';
import storage from '../storage';

const router: Router = Router();

// TODO: For more security:
// - find the item(s), given the file id
// - find the parent folder
// - find the group for the folder
// - confirm the user is a member of the group
// However, that prevents anonymous downloading.
// But, we could possibly trace it back to the
// permissions attached to an Access Link
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const contentLength = await storage.length(id);
    const fileStream = await storage.get(id);
    let cancelled = false;

    req.on('aborted', () => {
      cancelled = true;
      fileStream.destroy();
    });

    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': contentLength,
    });
    fileStream.pipe(res).on('finish', async () => {
      if (cancelled) {
        return;
      }
    });
  } catch (e) {
    res.sendStatus(404);
  }
});

export default router;
