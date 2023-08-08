import { Prisma } from "@prisma/client";
import { Router } from 'express';
import {
  createFolder
} from '../models';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).send("hey from folder router");
});

router.post('/', async (req, res) => {
  const { name, publicKey, ownerId }: { name: string, publicKey: string, ownerId: number } = req.body;
  console.log(name)
  console.log(publicKey)
  console.log(ownerId)

  try {
    const folder = await createFolder(name.trim().toLowerCase(), publicKey.trim(), ownerId);
    res.status(201).json({
      message: "Folder created",
      user: folder,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(400).json({
        message: "Folder already exists",
      });
    } else {
      console.log(error);
      res.status(500).json({
        message: "Server error.",
        // error: error.message,
      });
    }
  }
});


export default router;