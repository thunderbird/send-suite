import { Router } from 'express';

const router: Router = Router();

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Health
 *     summary: Server health check
 *     description: Simple endpoint to check if the server is alive
 *     responses:
 *       200:
 *         description: Returns an echo string
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: echo
 */
router.get('/', (_, res) => {
  res.status(200).send('echo');
});

/**
 * @openapi
 * /echo:
 *   get:
 *     tags:
 *       - Health
 *     summary: API echo endpoint
 *     description: Returns a JSON response to confirm API is functioning
 *     responses:
 *       200:
 *         description: Success response with message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: API echo response
 */
router.get('/echo', (_, res) => {
  res.status(200).json({ message: 'API echo response' });
});

/**
 * @openapi
 * /error:
 *   get:
 *     tags:
 *       - Debug
 *     summary: Simulate error
 *     description: Endpoint that simulates an error scenario for testing purposes
 *     responses:
 *       200:
 *         description: Success response with error simulation message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: API is simulating an error
 */
router.get('/error', (_, res) => {
  console.error('catching error on purpose');
  res.status(200).json({ message: 'API is simulating an error' });
});

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: API health check
 *     description: Endpoint to check the health status of the API
 *     responses:
 *       200:
 *         description: Success response indicating API health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   type: string
 *                   example: API is alive
 */
router.get('/api/health', (_, res) => {
  res.status(200).json({
    session: 'API is alive',
  });
});

export default router;
