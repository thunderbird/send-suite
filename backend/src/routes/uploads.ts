import crypto from 'crypto';
import { Router } from 'express';

import {
  addErrorHandling,
  UPLOAD_ERRORS,
  wrapAsyncHandler,
} from '../errors/routes';

import {
  createUpload,
  getUploadMetadata,
  getUploadSize,
  statUpload,
} from '../models/uploads';

import { getDataFromAuthenticatedRequest } from '@/auth/client';
import storage from '@/storage';
import { posthog_service, useMetrics } from '../metrics';
import {
  getGroupMemberPermissions,
  requireJWT,
  requireWritePermission,
} from '../middleware';

const router: Router = Router();

/**
 * This is actually the second step when uploading an encrypted file.
 * The first part is the actual upload via WebSockets.
 * This step creates the database entity for that uploaded file.
 */
router.post(
  '/',
  requireJWT,
  getGroupMemberPermissions,
  requireWritePermission,
  addErrorHandling(UPLOAD_ERRORS.NOT_CREATED),
  wrapAsyncHandler(async (req, res) => {
    const { id, size, ownerId, type } = req.body;
    const Metrics = useMetrics();

    const { uniqueHash } = getDataFromAuthenticatedRequest(req);

    const distinctId = uniqueHash;

    try {
      const upload = await createUpload(id, size, ownerId, type);
      Metrics.capture({
        event: 'upload.size',
        properties: { size, type, service: posthog_service },
        distinctId,
      });
      await Metrics.shutdown();
      return res.status(201).json({
        message: 'Upload created',
        upload,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: 'Upload not created',
      });
    }
  })
);

router.post(
  '/signed',
  requireJWT,
  addErrorHandling(UPLOAD_ERRORS.NO_BUCKET),
  wrapAsyncHandler(async (req, res) => {
    const uploadId = crypto.randomBytes(24).toString('hex');
    const { type } = req.body;
    try {
      const url = await storage.getUploadBucketUrl(uploadId, type);
      return res.json({ id: uploadId, url });
    } catch (error) {
      console.error('Error generating pre-signed URL:', error);
      return res.status(500).json(UPLOAD_ERRORS.NO_BUCKET);
    }
  })
);

router.get(
  '/:id/stat',
  addErrorHandling(UPLOAD_ERRORS.FILE_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const size = await statUpload(id);
    res.status(201).json({
      size,
    });
  })
);
// TODO: decide whether it's a security risk not to protect this route.
// I feel like it is, but it doesn't pertain to anything "perimssion-able".
// i.e., permissions are applied to containers, not to uploads.
router.get(
  '/:id/size',
  addErrorHandling(UPLOAD_ERRORS.FILE_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const size = await getUploadSize(id);
    res.status(201).json({
      size,
    });
  })
);

// TODO: decide whether it's a security risk not to protect this route.
// I feel like it is, but it doesn't pertain to anything "perimssion-able".
// i.e., permissions are applied to containers, not to uploads.
router.get(
  '/:id/metadata',
  addErrorHandling(UPLOAD_ERRORS.FILE_NOT_FOUND),
  wrapAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const metadata = await getUploadMetadata(id);
    res.status(201).json({
      ...metadata,
    });
  })
);

export default router;
