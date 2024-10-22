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

  it('should reject with a status 403 if token is not provided', async () => {
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

  it('should reject with a status 403 if token is invalid', async () => {
    const token = 'invalid.token';
    mockRequest.headers.cookie = `authorization=Bearer%20${token}`;

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
      message: `Not authorized: Invalid token`,
    });
    expect(mockedVerify).toHaveBeenCalled();
  });
});
