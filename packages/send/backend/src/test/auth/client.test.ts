/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { DAYS_TO_EXPIRY, JWT_EXPIRY, JWT_REFRESH_TOKEN_EXPIRY } from '@/config';
import { after, before, beforeEach } from 'node:test';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  checkAllowList,
  clearCookie,
  generateState,
  getAllowedOrigins,
  getClient,
  getDataFromAuthenticatedRequest,
  getIssuer,
  getStorageLimit,
  getUserFromJWT,
  isEmailInAllowList,
  registerAuthToken,
  registerTokens,
} from '../../auth/client';

const { mockedDecode, mockedSign } = vi.hoisted(() => ({
  mockedDecode: vi.fn(),
  mockedSign: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
  default: { decode: mockedDecode, sign: mockedSign },
}));

describe('Auth Client', () => {
  beforeAll(() => {
    vi.unstubAllEnvs();
  });

  describe('generateState', () => {
    it('should generate a random state', () => {
      const state = generateState();
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
    });
  });

  describe('getIssuer', () => {
    beforeEach(() => {
      vi.stubEnv('FXA_MOZ_ISSUER', 'https://accounts.stage.mozaws.net');
    });

    it('should return the issuer', async () => {
      const issuer = await getIssuer();
      expect(issuer).toBeDefined();
      expect(issuer.issuer).toBe('https://accounts.stage.mozaws.net');
    });
  });

  describe('getClient', () => {
    it('should return a client', () => {
      const issuer = {
        Client: vi.fn(),
      };

      //@ts-expect-error
      const client = getClient(issuer);
      expect(client).toBeDefined();
      expect(issuer.Client).toHaveBeenCalledWith({
        client_id: process.env.FXA_CLIENT_ID,
        client_secret: process.env.FXA_CLIENT_SECRET,
        redirect_uris: [process.env.FXA_REDIRECT_URI],
        response_types: ['code'],
        scopes: ['openid', 'profile'],
      });
    });
  });

  describe('isEmailInAllowList', () => {
    const allowList = `we_love_bread@example.example,@example.org`.split(',');

    it('should return true on matching domains', () => {
      const email = 'example@example.org';
      const result = isEmailInAllowList(email, allowList);
      expect(result).toBe(true);
    });

    it('should return true on matching unique values', () => {
      const email = 'we_love_bread@example.example';
      const result = isEmailInAllowList(email, allowList);
      expect(result).toBe(true);
    });

    it('should return false when domain is not in list', () => {
      const email = 'example@example.example';
      const result = isEmailInAllowList(email, allowList);
      expect(result).toBe(false);
    });

    it('should return false when email is not uniquely allowed', () => {
      const email = 'james@ham.com';
      const result = isEmailInAllowList(email, allowList);
      expect(result).toBe(false);
    });
  });
});

describe('getAllowedOrigins', () => {
  let originalEnv;

  // Back up the environment before we mess with it
  before(() => {
    originalEnv = process.env;
  });

  // Test various environment variable inputs
  it('should throw an error when no environment variable is provided', async () => {
    delete process.env.SEND_BACKEND_CORS_ORIGINS;
    expect(() => getAllowedOrigins()).toThrowError(
      'Environment variable SEND_BACKEND_CORS_ORIGINS must be set'
    );
  });

  it('should throw an error when an empty origin is provided', async () => {
    process.env.SEND_BACKEND_CORS_ORIGINS = '';
    expect(() => getAllowedOrigins()).toThrowError(
      'Environment variable SEND_BACKEND_CORS_ORIGINS must be set'
    );
  });

  it('should return an array with the correct single item when a single valid origin is provided', async () => {
    process.env.SEND_BACKEND_CORS_ORIGINS = 'http://localhost:12345';
    const origins = await getAllowedOrigins();
    expect(origins).toEqual(['http://localhost:12345']);
  });

  it('should return the correct array when multiple valid origins are provided', async () => {
    process.env.SEND_BACKEND_CORS_ORIGINS =
      'http://localhost:12345,http://thebestsite.edu';
    const origins = await getAllowedOrigins();
    expect(origins).toEqual([
      'http://localhost:12345',
      'http://thebestsite.edu',
    ]);
  });

  it('should handle spaces between origin strings', async () => {
    process.env.SEND_BACKEND_CORS_ORIGINS =
      'http://localhost:12345, http://thebestsite.edu, https://spaceforeand.aft ,';
    const origins = await getAllowedOrigins();
    expect(origins).toEqual([
      'http://localhost:12345',
      'http://thebestsite.edu',
      'https://spaceforeand.aft',
    ]);
  });

  // Restore the original environment
  after(() => {
    process.env = originalEnv;
  });
});

describe('checkAllowList', () => {
  beforeAll(() => {
    vi.unstubAllEnvs();
    vi.stubEnv(
      'FXA_ALLOW_LIST',
      '@example.org,@example.com,@example.ai,@examplewatch.com,@examplefoundation.org,@tortillas.com'
    );
  });

  it('should not throw errors when user in allow list', async () => {
    const noErrorHere = await checkAllowList('don@tortillas.com');
    expect(noErrorHere).toBeUndefined();
  });

  it('should throw when user is not in allow list', async () => {
    try {
      await checkAllowList('n@sync.com');
    } catch (error) {
      expect(error.message).toBe('User not in allow list');
    }
  });

  it('should throw when no email is passed', async () => {
    try {
      await checkAllowList('');
    } catch (error) {
      expect(error.message).toBe('checkAllowList requires an email');
    }
  });
});

describe('checkAllowList no .env', () => {
  beforeAll(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('FXA_ALLOW_LIST', '');
  });

  it('should not throw when no allow list is provided', async () => {
    const noErrorHere = await checkAllowList('ham@burger.com');
    expect(noErrorHere).toBeUndefined();
  });
});

describe('getUserFromJWT', () => {
  beforeAll(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('ACCESS_TOKEN_SECRET', 'your_secret');
  });

  it('should return the user from the token', () => {
    const mockedTokenData = { userId: '123' };
    mockedDecode.mockReturnValue(mockedTokenData);

    const data = getUserFromJWT('valid.token.here');
    expect(data).toStrictEqual(mockedTokenData);
  });

  it('should return null if token is invalid', () => {
    mockedDecode.mockReturnValue(null);
    // Make sure the function does not throw
    expect(() => {
      const data = getUserFromJWT('invalid.token');
      expect(data).toBeNull();
    }).not.toThrow();
  });

  describe('getDataFromAuthenticatedRequest', () => {
    beforeAll(() => {
      vi.unstubAllEnvs();
      vi.stubEnv('ACCESS_TOKEN_SECRET', 'your_secret');
    });

    it('should return the user from the authenticated request', () => {
      const mockedTokenData = { userId: '123' };
      mockedDecode.mockReturnValue(mockedTokenData);

      const req = {
        headers: {
          cookie: 'authorization=Bearer%20valid.token.here',
        },
      };
      //@ts-ignore
      const user = getDataFromAuthenticatedRequest(req as Request);
      expect(user).toStrictEqual(mockedTokenData);
    });

    it('should return null if authorization header is missing', () => {
      const req = {
        headers: {
          authorization: null,
        },
      };

      expect(() => {
        //@ts-ignore
        getDataFromAuthenticatedRequest(req as Request);
      }).toThrowError(
        'No token found in request: This should not happen if the user is authenticated'
      );
    });

    it('should return null if token is invalid', () => {
      mockedDecode.mockReturnValue(null);

      const req = {
        headers: {
          cookie: 'authorization=Bearer%20invalid.token',
        },
      };

      // @ts-ignore
      const user = getDataFromAuthenticatedRequest(req as Request);
      expect(user).toBeNull();
    });

    it('should return null if token format is incorrect', () => {
      const req = {
        headers: {
          authorization: 'InvalidTokenFormat',
        },
      };

      expect(() => {
        // @ts-ignore
        getDataFromAuthenticatedRequest(req as Request);
      }).toThrowError(
        'No token found in request: This should not happen if the user is authenticated'
      );
    });
  });
});

describe('registerAuthToken', () => {
  beforeAll(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('ACCESS_TOKEN_SECRET', 'test_secret');
  });

  it('should set cookie with correct parameters', () => {
    const mockRes = {
      cookie: vi.fn(),
    };
    const mockSignedData = {
      tier: 'PRO',
      email: 'test@example.com',
    };

    //@ts-ignore
    registerAuthToken(mockSignedData as any, mockRes);

    expect(mockRes.cookie).toHaveBeenCalledWith(
      'authorization',
      expect.stringContaining('Bearer '),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: expect.any(Number),
      })
    );
  });
});

describe('clearCookie', async () => {
  it('should clear the cookie', async () => {
    const mockRes = {
      cookie: vi.fn(),
    };
    clearCookie('cookie_name', mockRes as any);
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'cookie_name',
      'null',
      expect.objectContaining({
        maxAge: 0,
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      })
    );
  });
});

describe('registerTokens', () => {
  beforeAll(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('ACCESS_TOKEN_SECRET', 'test_secret');
    vi.stubEnv('REFRESH_TOKEN_SECRET', 'refresh_secret');
    vi.resetAllMocks();
  });

  it('should set both auth and refresh cookies with correct parameters', () => {
    const mockRes = {
      cookie: vi.fn(),
    };
    const mockSignedData = {
      tier: 'PRO',
      email: 'test@example.com',
    };

    mockedSign.mockReturnValueOnce('mocked_refresh_token');
    mockedSign.mockReturnValueOnce('mocked_auth_token');

    //@ts-ignore
    registerTokens(mockSignedData as any, mockRes);

    expect(mockRes.cookie).toHaveBeenCalledTimes(2);
    expect(mockRes.cookie).toHaveBeenNthCalledWith(
      1,
      'refresh_token',
      'Bearer mocked_refresh_token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: JWT_REFRESH_TOKEN_EXPIRY * 24 * 60 * 60 * 1000,
      })
    );
    expect(mockRes.cookie).toHaveBeenNthCalledWith(
      2,
      'authorization',
      'Bearer mocked_auth_token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: JWT_EXPIRY,
      })
    );
    expect(mockedSign).toHaveBeenCalledTimes(2);
    expect(mockedSign).toHaveBeenNthCalledWith(
      1,
      mockSignedData,
      'refresh_secret',
      expect.objectContaining({
        expiresIn: `${JWT_REFRESH_TOKEN_EXPIRY}d`,
      })
    );
    expect(mockedSign).toHaveBeenNthCalledWith(
      2,
      mockSignedData,
      'test_secret'
    );
  });
});

describe('getStorageLimit', () => {
  beforeAll(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('ACCESS_TOKEN_SECRET', 'your_secret');
  });

  it('should return hasLimitedStorage false for non-EPHEMERAL tier', () => {
    const mockedTokenData = { tier: 'PRO' };
    mockedDecode.mockReturnValue(mockedTokenData);

    const req = {
      headers: {
        cookie: 'authorization=Bearer%20valid.token.here',
      },
    };

    // @ts-ignore
    const result = getStorageLimit(req as Request);
    expect(result).toEqual({
      hasLimitedStorage: false,
      daysToExpiry: DAYS_TO_EXPIRY,
    });
  });

  it('should return hasLimitedStorage true for EPHEMERAL tier', () => {
    const mockedTokenData = { tier: 'EPHEMERAL' };
    mockedDecode.mockReturnValue(mockedTokenData);

    const req = {
      headers: {
        cookie: 'authorization=Bearer%20valid.token.here',
      },
    };

    // @ts-ignore
    const result = getStorageLimit(req as Request);
    expect(result).toEqual({
      hasLimitedStorage: true,
      daysToExpiry: DAYS_TO_EXPIRY,
    });
  });

  it('should throw error when no authorization is present', () => {
    const req = {
      headers: {
        cookie: '',
      },
    };

    expect(() => {
      //@ts-ignore
      getStorageLimit(req as Request);
    }).toThrowError(
      'No token found in request: This should not happen if the user is authenticated'
    );
  });
});
