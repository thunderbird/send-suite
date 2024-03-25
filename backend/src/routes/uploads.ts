import { Router } from 'express';

import { asyncHandler, onError } from '../errors/routes';

import {
  createUpload,
  getUploadSize,
  getUploadMetadata,
} from '../models/uploads';

import {
  requireLogin,
  getGroupMemberPermissions,
  canWrite,
} from '../middleware';

const router: Router = Router();

/**
 * This is actually the second step when uploading an encrypted file.
 * The first part is the actual upload via WebSockets.
 * This step creates the database entity for that uploaded file.
 */
router.post(
  '/',
  requireLogin,
  getGroupMemberPermissions,
  canWrite,
  onError(500, 'Could not upload file'),
  asyncHandler(async (req, res) => {
    const { id, size, ownerId, type } = req.body;

    const upload = await createUpload(id, size, ownerId, type);
    res.status(201).json({
      message: 'Upload created',
      upload,
    });
  })
);

// TODO: decide whether it's a security risk not to protect this route.
// I feel like it is, but it doesn't pertain to anything "perimssion-able".
// i.e., permissions are applied to containers, not to uploads.
router.get(
  '/:id/size',
  onError(500, 'Could not get file size'),
  asyncHandler(async (req, res) => {
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
  onError(500, 'Could not get file information'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const metadata = await getUploadMetadata(id);
    res.status(201).json({
      ...metadata,
    });
  })
);

export default router;
