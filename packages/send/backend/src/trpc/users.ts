import { hashPassword, verifyHash } from '@/auth/client';
import { VERSION } from '@/config';
import {
  createLoginSession,
  deleteContainer,
  deleteUpload,
  getContainersOwnedByUser,
  getUploadsOwnedByUser,
} from '@/models';
import { uuidv4 } from '@/utils';
import { checkCompatibility } from '@/utils/compatibility';
import { loginEmitter } from '@/ws/login';
import { TRPCError } from '@trpc/server';
import { createHash } from 'crypto';
import { on } from 'websocket';
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
  /**
   * @openapi
   * /trpc/getUser:
   *   get:
   *     tags:
   *       - Users
   *     summary: Get current user ID
   *     description: Returns the ID of the currently authenticated user
   *     responses:
   *       200:
   *         description: User ID
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   type: number
   *                   description: ID of the current user
   */
  getUser: trpc.query(({ ctx }) => {
    return { user: Number(ctx.user.id) };
  }),

  /**
   * @openapi
   * /trpc/getUserData:
   *   get:
   *     tags:
   *       - Users
   *     summary: Get current user data
   *     description: Returns the complete user data for the currently authenticated user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 userData:
   *                   type: object
   *                   description: Complete user data object
   */
  getUserData: trpc.use(isAuthed).query(async ({ ctx }) => {
    const userData = await getUserById(Number(ctx.user.id));
    return { userData: userData };
  }),

  /**
   * @openapi
   * /trpc/settings:
   *   get:
   *     tags:
   *       - Users
   *     summary: Get API settings and compatibility
   *     description: Returns API version and compatibility information
   *     parameters:
   *       - in: query
   *         name: input
   *         schema:
   *           type: object
   *           properties:
   *             version:
   *               type: string
   *               description: Client version to check compatibility against
   *     responses:
   *       200:
   *         description: API settings and compatibility information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 apiVersion:
   *                   type: string
   *                   description: Current API version
   *                 compatibility:
   *                   type: object
   *                   properties:
   *                     resolvedCompatibility:
   *                       type: boolean
   *                       description: Whether compatibility has been resolved
   *                     result:
   *                       type: string
   *                       description: Compatibility result
   *                 clientVersion:
   *                   type: string
   *                   description: Client version that was checked
   */
  settings: trpc
    .input(
      z.object({
        version: z.string(),
      })
    )
    .query(async ({ input: { version: clientVersion } }) => {
      const compatibility = {
        resolvedCompatibility: false,
        result: 'UNRESOLVED',
      };

      const compatibilityResult = checkCompatibility(clientVersion, VERSION!);

      compatibility.result = compatibilityResult;
      compatibility.resolvedCompatibility = true;

      const apiVersion = VERSION;
      return { apiVersion, compatibility, clientVersion };
    }),

  /**
   * @openapi
   * /trpc/onLoginFinished:
   *   get:
   *     tags:
   *       - Users
   *     summary: Subscribe to login completion events
   *     description: Returns a stream of login completion events
   *     parameters:
   *       - in: query
   *         name: input
   *         schema:
   *           type: object
   *           properties:
   *             name:
   *               type: string
   *               description: Name of the login event
   *     responses:
   *       200:
   *         description: Stream of login completion events
   */
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

  /**
   * @openapi
   * /trpc/resetKeys:
   *   post:
   *     tags:
   *       - Users
   *     summary: Reset user keys (Development Only)
   *     description: Resets user keys and deletes all containers and uploads (Development Only)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Keys reset successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   description: Whether the reset was successful
   */
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

  /**
   * @openapi
   * /trpc/userLogin:
   *   post:
   *     tags:
   *       - Users
   *     summary: User login (Development Only)
   *     description: Authenticates a user with email and password (Development Only)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 description: User's email address
   *               password:
   *                 type: string
   *                 description: User's password
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 state:
   *                   type: string
   *                   description: Login state token
   */
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

  /**
   * @openapi
   * /trpc/registerUser:
   *   post:
   *     tags:
   *       - Users
   *     summary: Register new user (Development Only)
   *     description: Creates a new user account (Development Only)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 description: User's email address
   *               password:
   *                 type: string
   *                 description: User's password
   *     responses:
   *       200:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: number
   *                   description: ID of the newly created user
   *                 state:
   *                   type: string
   *                   description: Login state token
   */
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
