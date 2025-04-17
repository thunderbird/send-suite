import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

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
import { useMetrics } from '../metrics';
import {
  getGroupMemberPermissions,
  requireJWT,
  requireWritePermission,
} from '../middleware';

const router: Router = Router();

/**
 * @openapi
 * /api/uploads:
 *   post:
 *     summary: Create a new upload
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hash:
 *                 type: string
 *               size:
 *                 type: integer
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Upload created successfully
 *       400:
 *         description: Failed to create upload
 */
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
        properties: { size, type },
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

/**
 * @openapi
 * /api/uploads/signed:
 *   post:
 *     summary: Get a pre-signed URL for uploading
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pre-signed URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 url:
 *                   type: string
 *       500:
 *         description: Failed to generate pre-signed URL
 */
router.post(
  '/signed',
  requireJWT,
  addErrorHandling(UPLOAD_ERRORS.NO_BUCKET),
  wrapAsyncHandler(async (req, res) => {
    const uploadId = uuidv4();
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

/**
 * @openapi
 * /api/uploads/{id}/stat:
 *   get:
 *     summary: Get the statistics of an upload by ID
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the upload
 *     responses:
 *       200:
 *         description: Upload statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 size:
 *                   type: integer
 *       404:
 *         description: Upload not found
 */
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

/**
 * @openapi
 * /api/uploads/{id}/size:
 *   get:
 *     summary: Get the size of an upload by ID
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the upload
 *     responses:
 *       200:
 *         description: Upload size retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 size:
 *                   type: integer
 *       404:
 *         description: Upload not found
 */
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

/**
 * @openapi
 * /api/uploads/{id}/metadata:
 *   get:
 *     summary: Get the metadata of an upload by ID
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the upload
 *     responses:
 *       200:
 *         description: Upload metadata retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metadata:
 *                   type: object
 *       404:
 *         description: Upload not found
 */
router.get(
  // TODO: decide whether it's a security risk not to protect this route.
  // I feel like it is, but it doesn't pertain to anything "perimssion-able".
  // i.e., permissions are applied to containers, not to uploads.
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
