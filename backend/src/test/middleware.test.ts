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
    mockRequest = {};
    mockResponse = {
      json: vi.fn(),
      status: vi.fn(() => mockResponse), // This chains the status and json methods
    };
    process.env.ACCESS_TOKEN_SECRET = 'your_secret_key';
  });

  it('should call next() for a valid token', async () => {
    const token = 'valid.token.here';
    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };
    vi.mocked(mockedVerify).mockImplementationOnce((token, secret, callback) =>
      callback(null, { userId: '123' })
    );

    await requireJWT(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockedVerify).toHaveBeenCalled();
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should reject with a status 403 if token is not provided', async () => {
    mockRequest.headers = {};

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
    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };
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
