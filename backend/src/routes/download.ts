import { Router } from 'express';

import storage from '../storage';
import {
  wrapAsyncHandler,
  addErrorHandling,
  DOWNLOAD_ERRORS,
} from '../errors/routes';
import { BaseError, TRANSFER_ERROR } from '../errors/models';

const router: Router = Router();

// Security for this route will be addressed in ticket #101
router.get(
  '/:id',
  addErrorHandling(DOWNLOAD_ERRORS.DOWNLOAD_FAILED),
  wrapAsyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
      const contentLength = await storage.length(id);
      const fileStream = await storage.get(id);
      let canceled = false;

      req.on('aborted', () => {
        canceled = true;
        fileStream.destroy();
      });

      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': contentLength,
      });
      fileStream.pipe(res).on('finish', async () => {
        if (canceled) {
          return;
        }
      });
    } catch (e) {
      throw new BaseError(DOWNLOAD_ERROR);
    }
  })
);

export default router;
