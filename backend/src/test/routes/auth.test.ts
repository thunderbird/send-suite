import * as authClient from '@/auth/client';
import * as utils from '@/utils';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authRouter from '../../routes/auth';

const { mockedVerify } = vi.hoisted(() => ({
  mockedVerify: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
  default: { verify: mockedVerify },
}));

describe('Auth Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
    vi.clearAllMocks();
  });

  describe('GET /auth/me', () => {
    it('should return success when authenticated', async () => {
      const token = 'invalid.token';
      const refreshToken = 'invalid.refresh';
      const cookie = `authorization=Bearer%20${token};refresh_token=Bearer%20${refreshToken}`;
      const response = await request(app).get('/auth/me').set('Cookie', cookie);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'success' });
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/auth/me');
      expect(response.status).toBe(403);
    });
  });

  describe('GET /auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const mockRefreshToken = 'valid_refresh_token';
      const mockSignedData = {
        email: 'my@email.com',
        id: 22,
        uniqueHash: '20ejf02ief',
      };

      vi.spyOn(utils, 'getCookie').mockReturnValue(mockRefreshToken);
      vi.spyOn(authClient, 'getJWTfromToken').mockReturnValue(mockRefreshToken);
      vi.spyOn(jwt, 'verify').mockImplementation(() => true);
      vi.spyOn(authClient, 'getUserFromJWT').mockReturnValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockSignedData as any
      );
      vi.spyOn(authClient, 'signJwt').mockResolvedValue({} as never);

      const response = await request(app)
        .get('/auth/refresh')
        .set('Cookie', ['refresh_token=valid_refresh_token']);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Token refreshed successfully');
    });
  });
});
