import { updateAccessLink } from '@/models/sharing';
import { z } from 'zod';
import { router, publicProcedure as t } from '../trpc';

export const sharingRouter = router({
  addPasswordToAccessLink: t
    .input(z.object({ linkId: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const { id, passwordHash } = await updateAccessLink(
          input.linkId,
          input.password
        );
        console.log('Access link updated', id, passwordHash);
        return { input: input, id, passwordHash };
      } catch (error) {
        console.error('Error updating access link', error);
        return { error: error.message };
      }
    }),
});
