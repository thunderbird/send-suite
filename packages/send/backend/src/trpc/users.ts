import { hashPassword, verifyHash } from '@/auth/client';
import {
  createLoginSession,
  deleteContainer,
  deleteUpload,
  getContainersOwnedByUser,
  getUploadsOwnedByUser,
} from '@/models';
import { uuidv4 } from '@/utils';
import { loginEmitter } from '@/ws/login';
import { TRPCError } from '@trpc/server';
import { createHash } from 'crypto';
import { on } from 'ws';
import { z } from 'zod';
import {
  createUserWithPassword,
  getHashedPassword,
  getUserByEmailV2,
  getUserById,
  resetKeys,
  updateUniqueHash,
} from '../models/users';
import { router, publicProcedure as trpc } from '../trpc';
import { isAuthed, requirePublicLogin, useEnvironment } from './middlewares';

export const usersRouter = router({
  getUser: trpc.query(({ ctx }) => {
    return { user: Number(ctx.user.id) };
  }),

  getUserData: trpc.use(isAuthed).query(async ({ ctx }) => {
    const userData = await getUserById(Number(ctx.user.id));
    return { userData: userData };
  }),

  onLoginFinished: trpc
    .input(
      z.object({
        name: z.string(),
      })
    )
    .subscription(async function* (opts) {
      if (opts.ctx?.user?.id) {
        console.log('logged in already');
        return;
      }
      // listen for new events
      for await (const [data] of on(loginEmitter, 'login_complete', {
        // Passing the AbortSignal from the request automatically cancels the event emitter when the request is aborted
        signal: opts.signal,
      })) {
        const post = data;
        yield post;
      }
    }),

  // ==========================
  // DO NOT USE IN PRODUCTION
  // ==========================

  // This mutation allows authed users to reset their passphrase
  resetKeys: trpc
    .use(isAuthed)
    .use((props) => useEnvironment(props, ['stage', 'development']))
    .mutation(async ({ ctx }) => {
      const id = Number(ctx.user.id);
      try {
        await resetKeys(id);
        const containers = await getContainersOwnedByUser(id);
        const uploads = await getUploadsOwnedByUser(id);

        // Burn containers
        await Promise.all(containers.map(({ id }) => deleteContainer(id)));
        // Burn uploads
        await Promise.all(uploads.map(({ id }) => deleteUpload(id)));

        return { success: true };
      } catch (e) {
        console.error(e);
        throw new TRPCError({
          message: 'Could not reset keys',
          code: 'UNPROCESSABLE_CONTENT',
        });
      }
    }),

  /* This mutation should not be used in production */
  userLogin: trpc
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
  registerUser: trpc
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
