import { z } from 'zod';
import { getUserById } from '../models/users';
import { router, publicProcedure as t } from '../trpc';
import { isAuthed } from './middlewares';

export const usersRouter = router({
  getUser: t.query(({ ctx }) => {
    return { user: Number(ctx.user.id) };
  }),

  getUserData: t
    .use(isAuthed)
    .input(z.object({ name: z.string() }))
    .query(async ({ input, ctx }) => {
      const userData = await getUserById(Number(ctx.user.id));
      return { name: input.name, userData: userData };
    }),
});
