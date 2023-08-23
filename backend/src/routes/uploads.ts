import { Router } from 'express';
import { createUpload, getUploadSize, getUploadMetadata } from '../models';
import storage from '../storage';

const router: Router = Router();

router.post('/', async (req, res) => {
  const { id, size, ownerId, type } = req.body;

  try {
    // Confirm that file `id` exists and what's on disk
    // is at least as large as the stated size.
    // (Encrypted files are larger than the decrypted contents)
    // storage.length(id) >= size

    const sizeOnDisk = await storage.length(id);
    if (sizeOnDisk >= size) {
      const upload = await createUpload(id, size, ownerId, type);
      res.status(201).json({
        message: 'Upload created',
        upload,
      });
    } else {
      res.status(400).json({
        message: 'File does not exist.',
        // error: error.message,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Server error.',
      // error: error.message,
    });
  }
});

router.get('/:id/size', async (req, res) => {
  const { id } = req.params;
  try {
    const size = await getUploadSize(id);
    res.status(201).json({
      size,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

router.get('/:id/metadata', async (req, res) => {
  const { id } = req.params;
  try {
    const metadata = await getUploadMetadata(id);
    res.status(201).json({
      ...metadata,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

export default router;
