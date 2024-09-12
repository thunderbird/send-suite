import { Router } from 'express';
import { TRANSFER_ERROR } from '../errors/models';
import {
  addErrorHandling,
  DOWNLOAD_ERRORS,
  wrapAsyncHandler,
} from '../errors/routes';
import storage from '../storage';

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
        try {
          fileStream.destroy();
        } catch (error) {
          console.error(error);
        }
      });

      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': contentLength,
      });
      fileStream.pipe(res);

      fileStream.on('finish', async () => {
        if (canceled) {
          return;
        }
      });
    } catch (e) {
      return res.status(404).send(TRANSFER_ERROR);
    }
  })
);

export default router;
