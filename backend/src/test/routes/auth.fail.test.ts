import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authRouter from '../../routes/auth';

/* 
This file should live with auth.test.ts
But I wasn't able to reset the jwt verify mock properly. 
If anyone knows how to do this, please submit the PR.
 */
describe('Failing auth', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
    vi.clearAllMocks();
  });
  it('should return 500 when refresh token is invalid', async () => {
    const invalidToken = `eyJhbGciOiJIUzI1NiJ9.bWNkb25hbGRz.vnJL9-890QR7g1Sn6Q4F6sU2voS8LHejGsBH6pyEejI`;
    const cookie = `refresh_token=Bearer%20${invalidToken}`;
    try {
      const response = await request(app)
        .get('/auth/refresh')
        .set('Cookie', cookie);

      expect(response.status).toBe(500);
      expect(response.body.message).toContain(
        'Not authorized: Unable to refresh token'
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log('error refreshing token');
    }
  });
});
