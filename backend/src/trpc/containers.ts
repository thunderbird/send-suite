import { getAccessLinksForContainer as getAccessLinks } from '@/models/containers';
import { getAllUserGroupContainers } from '@/models/users';
import { addExpiryToContainer } from '@/utils';
import { ContainerType } from '@prisma/client';
import { z } from 'zod';
import { router, publicProcedure as t } from '../trpc';
import { isAuthed } from './middlewares';

export const containersRouter = router({
  getTotalUsedStorage: t.use(isAuthed).query(async ({ ctx }) => {
    const userId = Number(ctx.user.id);
    const folders = await getAllUserGroupContainers(
      userId,
      ContainerType.FOLDER
    );

    if (!ctx?.user?.hasLimitedStorage === true) {
      const active = folders
        .flatMap((folder) =>
          folder.items
            // Add expiry information to each upload
            .map((item) => item.upload)
        )
        // Get the size of each upload
        .map((item) => item.size)
        // Make a sum of all the sizes that haven't expired
        .reduce((sizeA, sizeB) => sizeA + sizeB, 0);

      return {
        expired: 0,
        active,
      };
    }

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
      // Make a sum of all the sizes that have expired
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

  getAccessLinksForContainer: t
    .use(isAuthed)
    .input(z.object({ containerId: z.number() }))
    .query(async ({ input }) => {
      const accessLinks = await getAccessLinks(input.containerId);
      return accessLinks;
    }),
});
