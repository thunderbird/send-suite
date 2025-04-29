import * as authClient from '@/auth/client';
import * as utils from '@/utils';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authRouter from '../../routes/auth';

const {
  mockedVerify,
  mockedGetLoginSession,
  mockedGetUserByEmail,
  mockedGetUserById,
} = vi.hoisted(() => ({
  mockedVerify: vi.fn(),
  mockedGetLoginSession: vi.fn(),
  mockedGetUserByEmail: vi.fn(),
  mockedGetUserById: vi.fn(),
  mockAuthenticatedRequest: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
  default: { verify: mockedVerify },
}));

vi.mock('@/models', () => ({
  getLoginSession: mockedGetLoginSession,
}));

vi.mock('@/models/users', () => ({
  getUserByEmail: mockedGetUserByEmail,
  getUserById: mockedGetUserById,
}));

describe('Auth Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
    vi.clearAllMocks();
    vi.stubEnv('ALLOW_PUBLIC_LOGIN', 'true');
  });

  describe('GET /auth/me', () => {
    it('should return success when authenticated', async () => {
      vi.spyOn(authClient, 'getDataFromAuthenticatedRequest').mockReturnValue({
        id: '1',
        uniqueHash: 'unique_hash',
        email: 'something',
        tier: 'FREE',
      });
      mockedGetUserById.mockResolvedValue({
        id: '1',
        uniqueHash: 'unique_hash',
        email: 'something',
        tier: 'FREE',
      });
      const token = 'invalid.token';
      const refreshToken = 'invalid.refresh';
      const cookie = `authorization=Bearer%20${token};refresh_token=Bearer%20${refreshToken}`;
      const response = await request(app).get('/auth/me').set('Cookie', cookie);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'success' });
    });

    it('should return auth failure when user is not in the database', async () => {
      vi.spyOn(authClient, 'getDataFromAuthenticatedRequest').mockReturnValue({
        id: '1',
        uniqueHash: 'unique_hash',
        email: 'something',
        tier: 'FREE',
      });
      mockedGetUserById.mockResolvedValue(null);
      const token = 'invalid.token';
      const refreshToken = 'invalid.refresh';
      const cookie = `authorization=Bearer%20${token};refresh_token=Bearer%20${refreshToken}`;
      const response = await request(app).get('/auth/me').set('Cookie', cookie);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Authorization failed.' });
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
      vi.spyOn(authClient, 'registerAuthToken').mockResolvedValue({} as never);

      const response = await request(app)
        .get('/auth/refresh')
        .set('Cookie', ['refresh_token=valid_refresh_token']);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Token refreshed successfully');
    });
  });

  describe('GET /auth/login', () => {
    it('should successfully login user', async () => {
      const mockState = 'valid-state';
      const mockEmail = 'test@example.com';
      const mockSession = { fxasession: `session____${mockEmail}` };
      const mockUserData = {
        id: 1,
        uniqueHash: 'hash123',
        email: mockEmail,
        tier: 'FREE',
      };

      mockedGetLoginSession.mockResolvedValue(mockSession);
      mockedGetUserByEmail.mockResolvedValue(mockUserData);
      vi.spyOn(authClient, 'registerTokens').mockImplementation(() => {});

      const response = await request(app).get(`/auth/login?state=${mockState}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'success' });
    });
  });

  describe('GET /auth/register', () => {
    it('should successfully register user', async () => {
      const mockState = 'valid-state';
      const mockEmail = 'test@example.com';
      const mockSession = { fxasession: `session____${mockEmail}` };
      const mockUserData = {
        id: 1,
        uniqueHash: 'hash123',
        email: mockEmail,
        tier: 'FREE',
      };

      mockedGetLoginSession.mockResolvedValue(mockSession);
      mockedGetUserByEmail.mockResolvedValue(mockUserData);
      vi.spyOn(authClient, 'registerTokens').mockImplementation(() => {});

      const response = await request(app).get(
        `/auth/register?state=${mockState}`
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'success' });
    });
  });

  describe('GET /auth/refresh error cases', () => {
    it('should return 500 when refresh token is invalid', async () => {
      vi.spyOn(utils, 'getCookie').mockReturnValue('invalid_token');
      vi.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/auth/refresh')
        .set('Cookie', ['refresh_token=invalid_token']);

      expect(response.status).toBe(500);
      expect(response.body.message).toContain(
        'Not authorized: Unable to refresh token'
      );
    });
  });
});
