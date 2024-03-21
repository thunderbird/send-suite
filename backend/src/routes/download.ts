import { Router } from 'express';

import storage from '../storage';
import { asyncHandler, onError } from '../errors/routes';

const router: Router = Router();

// TODO: For more security:
// - find the item(s), given the file id
// - find the parent folder
// - find the group for the folder
// - confirm the user is a member of the group
// However, that prevents anonymous downloading.
// But, we could possibly trace it back to the
// permissions attached to an Access Link
router.get(
  '/:id',
  onError(404, 'Could not find file'),
  asyncHandler(async (req, res) => {
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
      // TODO: change this to a custom error with a 404 status
      throw new Error(`Could not download`);
    }
  })
);

export default router;
