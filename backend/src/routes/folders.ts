import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { createFolder, getOwnedFolders } from '../models';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).send('hey from folder router');
});

router.post('/', async (req, res) => {
  const {
    name,
    publicKey,
    ownerId,
  }: {
    name: string;
    publicKey: string;
    ownerId: number;
  } = req.body;
  console.log(name);
  console.log(publicKey);
  console.log(ownerId);

  const messagesByCode: Record<string, string> = {
    P2002: 'Folder already exists',
    P2003: 'User does not exist',
  };

  const defaultMessage = 'Bad request';

  try {
    const folder = await createFolder(
      name.trim().toLowerCase(),
      publicKey.trim(),
      ownerId
    );
    res.status(201).json({
      message: 'Folder created',
      user: folder,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(400).json({
        message: messagesByCode[error.code] || defaultMessage,
      });
    } else {
      console.log(error);
      res.status(500).json({
        message: 'Server error.',
        // error: error.message,
      });
    }
  }
});

router.get('/owner/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const folders = await getOwnedFolders(parseInt(userId));
    res.status(200).json(folders);
  } catch (error) {
    res.status(500).json({
      message: 'Server error.',
    });
  }
});

export default router;
