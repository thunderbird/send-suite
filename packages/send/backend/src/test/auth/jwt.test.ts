import { getJWTfromToken } from '@/auth/client';
import { validateJWT } from '@/auth/jwt';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth/client', () => ({
  getJWTfromToken: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

describe('validateJWT', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ACCESS_TOKEN_SECRET = 'test-secret';
  });

  it('should return null when no tokens are present', () => {
    vi.mocked(getJWTfromToken).mockReturnValue('');

    const result = validateJWT({
      jwtToken: '',
      jwtRefreshToken: '',
    });

    expect(result).toBeNull();
  });

  it('should return valid when token verification succeeds', () => {
    vi.mocked(getJWTfromToken).mockReturnValue('valid-token');
    vi.mocked(jwt.verify).mockReturnValue({} as never);

    const result = validateJWT({
      jwtToken: 'valid-token',
      jwtRefreshToken: 'refresh-token',
    });

    expect(result).toBe('valid');
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
  });

  it('should return shouldRefresh when token verification fails', () => {
    vi.resetAllMocks();
    vi.mocked(getJWTfromToken).mockReturnValue('valid-token');
    vi.mocked(jwt.verify)
      .mockImplementationOnce(() => ({}) as never) // first call succeeds
      .mockImplementationOnce(() => {
        throw new Error('Token invalid');
      }); // second call throws

    const result = validateJWT({
      jwtToken: 'invalid-token',
      jwtRefreshToken: 'refresh-token',
    });

    expect(result).toBe('shouldRefresh');
  });

  it('should return null when refresh token is not valid', () => {
    vi.mocked(getJWTfromToken).mockReturnValue('invalid-refresh-token');
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('Token invalid');
    });

    const result = validateJWT({
      jwtToken: 'valid-token',
      jwtRefreshToken: 'invalid-refresh-token',
    });

    expect(result).toBe('shouldLogin');
  });
});
