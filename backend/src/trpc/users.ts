import { hashPassword, verifyHash } from '@/auth/client';
import { createLoginSession } from '@/models';
import { uuidv4 } from '@/utils';
import { TRPCError } from '@trpc/server';
import { createHash } from 'crypto';
import { z } from 'zod';
import {
  createUserWithPassword,
  getHashedPassword,
  getUserByEmailV2,
  getUserById,
  updateUniqueHash,
} from '../models/users';
import { router, publicProcedure as t } from '../trpc';
import { isAuthed, requirePublicLogin } from './middlewares';

export const usersRouter = router({
  getUser: t.query(({ ctx }) => {
    return { user: Number(ctx.user.id) };
  }),

  getUserData: t.use(isAuthed).query(async ({ ctx }) => {
    const userData = await getUserById(Number(ctx.user.id));
    return { userData: userData };
  }),

  // ==========================
  // Public routes (DO NOT USE IN PRODUCTION)
  // ==========================

  /* This mutation should not be used in production */
  userLogin: t
    .use(requirePublicLogin)
    .input(
      z.object({
        email: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Check if the user already exists
      try {
        const userData = await getHashedPassword(input.email);
        // If the user already exists, throw a conflict error
        if (!userData?.hashedPassword) {
          throw Error('User not found');
        }

        const isPasswordMatch = await verifyHash(
          input.password,
          userData.hashedPassword
        );

        if (!isPasswordMatch) {
          throw Error('Password does not match');
        }

        const { state } = await handleSuccessfulLogin(input.email, userData.id);
        return { state };
      } catch {
        throw new TRPCError({
          message: 'Incorrect email or password',
          code: 'BAD_REQUEST',
        });
      }
    }),

  /* This mutation should not be used in production */
  registerUser: t
    .use(requirePublicLogin)
    .input(
      z.object({
        email: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Check if the user already exists
      try {
        const userData = await getUserByEmailV2(input.email);
        // If the user already exists, throw a conflict error
        if (userData?.id) {
          throw Error('User already exists');
        }
      } catch {
        throw new TRPCError({
          message: 'User already exists',
          code: 'CONFLICT',
        });
      }

      try {
        const hashedPassword = await hashPassword(input.password);

        const { id } = await createUserWithPassword(
          input.email,
          hashedPassword
        );

        const { state } = await handleSuccessfulLogin(input.email, id);

        return { id, state };
      } catch (e) {
        console.error(e);
        throw new TRPCError({
          message: 'Unable to create new user',
          code: 'UNPROCESSABLE_CONTENT',
        });
      }
    }),
});

async function handleSuccessfulLogin(email: string, id: number) {
  const uid = uuidv4();
  // Generate the unique_id with the user's email
  const state = `${uid}____${email}`;

  const uniqueHash = createHash('sha256').update(uid).digest('hex');

  await updateUniqueHash(id, uniqueHash);

  await createLoginSession(state);
  return { state, id };
}
