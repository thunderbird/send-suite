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

const router = Router();

// We should:
// - find the item, given the file id
// - find the parent folder
// - find the group for the folder
// - confirm the user is a member of the group
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

      //   const dl = meta.dl + 1;
      //   const dlimit = meta.dlimit;
      //   try {
      //     if (dl >= dlimit) {
      //       await storage.del(id);
      //     } else {
      //       await storage.incrementField(id, "dl");
      //     }
      //   } catch (e) {
      //     log.info("StorageError:", id);
      //   }
    });
  } catch (e) {
    res.sendStatus(404);
  }
});

export default router;
