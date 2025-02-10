import { getUserById } from '../models/users';
import { router, publicProcedure as t } from '../trpc';
import { isAuthed } from './middlewares';

export const usersRouter = router({
  getUser: t.query(({ ctx }) => {
    return { user: Number(ctx.user.id) };
  }),

  getUserData: t.use(isAuthed).query(async ({ ctx }) => {
    const userData = await getUserById(Number(ctx.user.id));
    return { userData: userData };
  }),
});
