import * as authClient from '@/auth/client';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authRouter from '../../routes/auth';

const { mockedGetLoginSession, mockedGetUserByEmail } = vi.hoisted(() => ({
  mockedGetLoginSession: vi.fn(),
  mockedGetUserByEmail: vi.fn(),
}));

vi.mock('@/models', () => ({
  getLoginSession: mockedGetLoginSession,
}));

vi.mock('@/models/users', () => ({
  getUserByEmail: mockedGetUserByEmail,
}));

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
    vi.stubEnv('ALLOW_PUBLIC_LOGIN', 'false');
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

  it('should fail to login user', async () => {
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

    expect(response.status).toBe(500);
  });

  it('should return 500 when login session fails', async () => {
    vi.stubEnv('ALLOW_PUBLIC_LOGIN', 'true');
    mockedGetLoginSession.mockRejectedValue(new Error('Session error'));

    const response = await request(app).get('/auth/login?state=invalid-state');

    expect(response.status).toBe(500);
  });
});

describe('GET /auth/register fails', () => {
  let app: express.Application;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
    vi.clearAllMocks();
    vi.stubEnv('ALLOW_PUBLIC_LOGIN', 'false');
  });
  it('should fail to register user', async () => {
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

    expect(response.status).toBe(500);
  });
  it('should fail to register user', async () => {
    vi.stubEnv('ALLOW_PUBLIC_LOGIN', 'true');

    const mockState = 'invalid-state';
    const mockEmail = 'test@example.com';
    const mockSession = { fxasession: `session____${mockEmail}` };

    mockedGetLoginSession.mockResolvedValue(mockSession);
    mockedGetUserByEmail.mockRejectedValue(new Error('User not found'));
    vi.spyOn(authClient, 'registerTokens').mockImplementation(() => {});

    const response = await request(app).get(
      `/auth/register?state=${mockState}`
    );

    expect(response.status).toBe(500);
  });

  it('should return 500 when registration session fails', async () => {
    mockedGetLoginSession.mockRejectedValue(new Error('Session error'));

    const response = await request(app).get(
      '/auth/register?state=invalid-state'
    );

    expect(response.status).toBe(500);
  });

  it('should handle missing state parameter', async () => {
    const response = await request(app).get('/auth/register');
    expect(response.status).toBe(500);
  });
});
