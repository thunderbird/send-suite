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
    // Get the total size of all the uploads that haven't expired

    const expired = folders
      .flatMap((folder) =>
        folder.items
          // Add expiry information to each upload
          .map((item) => addExpiryToContainer(item.upload))
          // Filter out the expired uploads
          .filter((item) => item.expired === true)
          // Get the size of each upload
          .map((item) => item.size)
      )
      // Make a sum of all the sizes that haven't expired
      .reduce((sizeA, sizeB) => sizeA + sizeB, 0);

    const active = folders
      .flatMap((folder) =>
        folder.items
          // Add expiry information to each upload
          .map((item) => addExpiryToContainer(item.upload))
          // Filter out the expired uploads
          .filter((item) => item.expired === false)
          // Get the size of each upload
          .map((item) => item.size)
      )
      // Make a sum of all the sizes that haven't expired
      .reduce((sizeA, sizeB) => sizeA + sizeB, 0);

    return {
      expired,
      active,
    };
  }),
});
