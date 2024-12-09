import { ContainerType } from '@prisma/client';
import { z } from 'zod';
import { getAllUserGroupContainers, getUserById } from './models/users';
import { router, publicProcedure as t } from './trpc';
import { addExpiryToContainer } from './utils';

export const userRouter = router({
  getUser: t.query(({ ctx }) => {
    return { user: Number(ctx.user.id) };
  }),

  getUserData: t
    .input(z.object({ name: z.string() }))
    .query(async ({ input, ctx }) => {
      const userData = await getUserById(Number(ctx.user.id));
      return { name: 'Bilbo ' + input.name, userData: userData };
    }),

  getTotalUsedStorage: t.query(async ({ ctx }) => {
    const userId = Number(ctx.user.id);
    const folders = await getAllUserGroupContainers(
      userId,
      ContainerType.FOLDER
    );
    return folders
      .flatMap((folder) =>
        folder.items
          .map((item) => addExpiryToContainer(item.upload))
          .filter((i) => i.expired === false)
          .map((i) => i.size)
      )
      .reduce((a, b) => a + b, 0);
  }),
});
