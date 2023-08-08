import { Prisma } from "@prisma/client";
import { Router } from 'express';
import {
  createUser
} from '../models';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).send("hey from user router");
})

router.post('/', async (req, res) => {
  const { email, publicKey }: { email: string, publicKey: string } = req.body;
  console.log(email)
  console.log(publicKey)

  try {
    const user = await createUser(email.trim().toLowerCase(), publicKey.trim());
    res.status(201).json({
      message: "User created",
      user,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(400).json({
        message: "User already exists",
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