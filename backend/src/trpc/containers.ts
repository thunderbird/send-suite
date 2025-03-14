import { IS_USING_BUCKET_STORAGE, TOTAL_STORAGE_LIMIT } from '@/config';
import { getAccessLinksForContainer as getAccessLinks } from '@/models/containers';
import { getAllUserGroupContainers } from '@/models/users';
import { addExpiryToContainer } from '@/utils';
import { ContainerType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure as t } from '../trpc';
import { isAuthed } from './middlewares';

export const containersRouter = router({
  getTotalUsedStorage: t.use(isAuthed).query(async ({ ctx }) => {
    const response = {
      expired: 0,
      active: 0,
      limit: TOTAL_STORAGE_LIMIT,
    };

    try {
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

        response.active = active;
        response.expired = expired;
      }
      const active = folders
        // Make a sum of all the sizes that haven't expired
        .flatMap((folder) => folder.items.map((item) => item.upload.size))
        .reduce((sizeA, sizeB) => sizeA + sizeB, 0);

      response.active = active;
      response.expired = 0;
    } catch {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while calculating the total storage used',
      });
    }
    return response;
  }),

  getAccessLinksForContainer: t
    .use(isAuthed)
    .input(z.object({ containerId: z.number() }))
    .query(async ({ input }) => {
      const accessLinks = await getAccessLinks(input.containerId);
      return accessLinks;
    }),

  getStorageType: t.query(async () => {
    if (typeof IS_USING_BUCKET_STORAGE === 'boolean') {
      return { isBucketStorage: IS_USING_BUCKET_STORAGE };
    }
    return { isBucketStorage: false };
  }),
});
