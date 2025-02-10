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

    // If the user has a limited storage, we need to calculate the total size of the active uploads and the expired uploads
    if (ctx.user.hasLimitedStorage) {
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
    }
    const active = folders
      // Make a sum of all the sizes that haven't expired
      .flatMap((folder) => folder.items.map((item) => item.upload.size))
      .reduce((sizeA, sizeB) => sizeA + sizeB, 0);

    return {
      // The user doesn't have a storage limit, they can't have expired files
      expired: 0,
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
