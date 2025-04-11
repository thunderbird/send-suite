import {
  getAccessLinkRetryCount,
  incrementAccessLinkRetryCount,
  updateAccessLink,
} from '@/models/sharing';
import { z } from 'zod';
import { router, publicProcedure as t } from '../trpc';

export const sharingRouter = router({
  /**
   * @openapi
   * /trpc/addPasswordToAccessLink:
   *   post:
   *     tags:
   *       - Sharing
   *     summary: Add password to access link
   *     description: Adds a password to an existing access link
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               linkId:
   *                 type: string
   *                 description: ID of the access link
   *               password:
   *                 type: string
   *                 description: Password to add to the access link
   *     responses:
   *       200:
   *         description: Access link updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 input:
   *                   type: object
   *                   description: Original input parameters
   *                 id:
   *                   type: string
   *                   description: ID of the updated access link
   *                 passwordHash:
   *                   type: string
   *                   description: Hash of the password
   */
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

  /**
   * @openapi
   * /trpc/incrementPasswordRetryCount:
   *   post:
   *     tags:
   *       - Sharing
   *     summary: Increment password retry count
   *     description: Increments the retry count for password attempts on an access link
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               linkId:
   *                 type: string
   *                 description: ID of the access link
   *     responses:
   *       200:
   *         description: Retry count incremented successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   description: ID of the access link
   *                 retryCount:
   *                   type: number
   *                   description: Updated retry count
   */
  incrementPasswordRetryCount: t
    .input(z.object({ linkId: z.string() }))
    .mutation(async ({ input }) => {
      const id = input.linkId;
      let retryCount = 0;
      try {
        const res = await incrementAccessLinkRetryCount(input.linkId);
        retryCount = res.retryCount;
      } catch (error) {
        console.error('Error incrementing password retry count', error);
      }
      return { id, retryCount };
    }),

  /**
   * @openapi
   * /trpc/getPasswordRetryCount:
   *   get:
   *     tags:
   *       - Sharing
   *     summary: Get password retry count
   *     description: Retrieves the current retry count for password attempts on an access link
   *     parameters:
   *       - in: query
   *         name: input
   *         schema:
   *           type: object
   *           properties:
   *             linkId:
   *               type: string
   *               description: ID of the access link
   *     responses:
   *       200:
   *         description: Current retry count
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   description: ID of the access link
   *                 retryCount:
   *                   type: number
   *                   description: Current retry count
   */
  getPasswordRetryCount: t
    .input(z.object({ linkId: z.string() }))
    .query(async ({ input }) => {
      const id = input.linkId;
      let retryCount = 0;
      try {
        const res = await getAccessLinkRetryCount(input.linkId);
        retryCount = res.retryCount;
      } catch (error) {
        console.error('Error getting password retry count', error);
      }
      return { id, retryCount };
    }),
});
