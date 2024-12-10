import { getAllUserGroupContainers } from '@/models/users';
import { addExpiryToContainer } from '@/utils';
import { ContainerType } from '@prisma/client';
import { router, publicProcedure as t } from '../trpc';

export const containersRouter = router({
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
