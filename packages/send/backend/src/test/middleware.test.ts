import { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireJWT } from '../middleware';

const { mockedVerify } = vi.hoisted(() => ({
  mockedVerify: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
  default: { verify: mockedVerify },
}));

describe('requireJWT', () => {
  let mockRequest: Partial<Request>;
  let mockResponse;
  const nextFunction = vi.fn();

  beforeEach(() => {
    mockedVerify.mockClear();
    mockRequest = { headers: { cookie: '' } };
    mockResponse = {
      json: vi.fn(),
      status: vi.fn(() => mockResponse), // This chains the status and json methods
    };
    process.env.ACCESS_TOKEN_SECRET = 'your_secret_key';
  });

  it('should call next() for a valid token', async () => {
    const token = 'valid.token.here';
    mockRequest.headers.cookie = `authorization=Bearer%20${token}`;

    vi.mocked(mockedVerify).mockReturnValue({
      id: '2',
      uniqueHash:
        '906f57920630c73eccb51d3a65c032fa660115178633949779b5932b0291a108',
      exp: 11111,
      iat: 22222,
    });

    expect(async () => {
      await requireJWT(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );
    }).not.toThrow();

    expect(mockedVerify).toHaveBeenCalled();
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should reject with a status 403 if both token and refresh token are empty', async () => {
    mockRequest.headers.cookie = '';

    await requireJWT(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Not authorized: Token not found',
    });
  });

  it('should reject with a status 401 if the token is invalid', async () => {
    const token = 'invalid.token';
    const refreshToken = 'valid.refresh';
    mockRequest.headers.cookie = `authorization=Bearer%20${token};refresh_token=Bearer%20${refreshToken}`;

    vi.mocked(mockedVerify).mockImplementation((token, secret, callback) => {
      if (token === 'invalid.token') {
        callback(new Error('Invalid token'), null);
      }
    });

    await requireJWT(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toBeCalledWith({
      message: `Not authorized: Token expired`,
    });
    expect(mockedVerify).toHaveBeenCalled();
  });

  it('should reject with a status 403 if refresh token is invalid', async () => {
    const token = 'invalid.token';
    const refreshToken = 'valid.refresh';
    mockRequest.headers.cookie = `authorization=Bearer%20${token};refresh_token=Bearer%20${refreshToken}`;

    vi.mocked(mockedVerify).mockImplementationOnce((token, secret, callback) =>
      callback(new Error('Invalid token'), null)
    );

    await requireJWT(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toBeCalledWith({
      message: `Not authorized: Refresh token expired`,
    });
    expect(mockedVerify).toHaveBeenCalled();
  });
});
