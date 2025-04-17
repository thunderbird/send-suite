import { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDataFromAuthenticatedRequest } from '../auth/client';
import { validateJWT } from '../auth/jwt';
import { getGroupMemberPermissions, requireJWT } from '../middleware';
import { fromPrismaV2 } from '../models/prisma-helper';
import { allPermissions, PermissionType } from '../types/custom';

const { mockedVerify } = vi.hoisted(() => ({
  mockedVerify: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
  default: { verify: mockedVerify },
}));

vi.mock('../auth/client', () => ({
  getDataFromAuthenticatedRequest: vi.fn(),
}));

vi.mock('../models/prisma-helper', () => ({
  fromPrismaV2: vi.fn(),
}));

vi.mock('../auth/jwt', () => ({
  validateJWT: vi.fn(),
}));

vi.mock('../types/custom', () => ({
  allPermissions: vi.fn(),
  PermissionType: {
    READ: 2,
    WRITE: 4,
    SHARE: 8,
    ADMIN: 16,
  },
}));

describe('requireJWT', () => {
  let mockRequest: Partial<Request>;
  let mockResponse;
  const nextFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = { headers: { cookie: '' } };
    mockResponse = {
      json: vi.fn(),
      status: vi.fn(() => mockResponse),
    };
    process.env.ACCESS_TOKEN_SECRET = 'your_secret_key';
  });

  it('should call next() for a valid token', async () => {
    const token = 'valid.token.here';
    mockRequest.headers.cookie = `authorization=Bearer%20${token}`;

    vi.mocked(validateJWT).mockReturnValue('valid');

    await requireJWT(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(validateJWT).toHaveBeenCalled();
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should reject with a status 403 if both token and refresh token are empty', async () => {
    mockRequest.headers.cookie = '';

    vi.mocked(validateJWT).mockReturnValue(null);

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

    vi.mocked(validateJWT).mockReturnValue('shouldRefresh');

    await requireJWT(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toBeCalledWith({
      message: `Not authorized: Token expired`,
    });
  });

  it('should reject with a status 403 if refresh token is invalid', async () => {
    const token = 'invalid.token';
    const refreshToken = 'valid.refresh';
    mockRequest.headers.cookie = `authorization=Bearer%20${token};refresh_token=Bearer%20${refreshToken}`;

    vi.mocked(validateJWT).mockReturnValue('shouldLogin');

    await requireJWT(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toBeCalledWith({
      message: `Not authorized: Refresh token expired`,
    });
  });
});

describe('getGroupMemberPermissions', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Response;
  const nextFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = {
      headers: { cookie: '' },
      params: {},
      body: {},
    };
    mockResponse = {
      json: vi.fn(),
      status: vi.fn(() => mockResponse),
    } as unknown as Response;
    vi.mocked(validateJWT).mockReturnValue('valid');
    vi.mocked(allPermissions).mockReturnValue(
      PermissionType.READ |
        PermissionType.WRITE |
        PermissionType.SHARE |
        PermissionType.ADMIN
    );
  });

  it('should set all permissions for top-level folder when no containerId is provided', async () => {
    const userId = '123';
    vi.mocked(getDataFromAuthenticatedRequest).mockReturnValue({
      id: userId,
      uniqueHash: 'hash123',
      email: 'test@example.com',
      tier: 'PRO',
    });
    mockRequest.headers.cookie = 'authorization=Bearer valid.token';

    await getGroupMemberPermissions(
      mockRequest as Request,
      mockResponse,
      nextFunction
    );

    expect(mockRequest['_permission']).toBeDefined();
    expect(mockRequest['_permission']).toBe(
      PermissionType.READ |
        PermissionType.WRITE |
        PermissionType.SHARE |
        PermissionType.ADMIN
    );
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should set permissions from group membership when containerId is provided in params', async () => {
    const userId = '123';
    const containerId = '456';
    const groupId = '789';
    const mockPermissions =
      PermissionType.READ | PermissionType.WRITE | PermissionType.SHARE;

    vi.mocked(getDataFromAuthenticatedRequest).mockReturnValue({
      id: userId,
      uniqueHash: 'hash123',
      email: 'test@example.com',
      tier: 'PRO',
    });
    mockRequest.headers.cookie = 'authorization=Bearer valid.token';
    mockRequest.params = { containerId };

    vi.mocked(fromPrismaV2)
      .mockResolvedValueOnce({ id: groupId }) // group.findFirstOrThrow
      .mockResolvedValueOnce({ permission: mockPermissions }); // membership.findUniqueOrThrow

    await getGroupMemberPermissions(
      mockRequest as Request,
      mockResponse,
      nextFunction
    );

    expect(mockRequest['_permission']).toBe(mockPermissions);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should set permissions from group membership when containerId is provided in body', async () => {
    const userId = '123';
    const containerId = '456';
    const groupId = '789';
    const mockPermissions =
      PermissionType.READ | PermissionType.WRITE | PermissionType.SHARE;

    vi.mocked(getDataFromAuthenticatedRequest).mockReturnValue({
      id: userId,
      uniqueHash: 'hash123',
      email: 'test@example.com',
      tier: 'PRO',
    });
    mockRequest.headers.cookie = 'authorization=Bearer valid.token';
    mockRequest.body = { containerId };

    vi.mocked(fromPrismaV2)
      .mockResolvedValueOnce({ id: groupId }) // group.findFirstOrThrow
      .mockResolvedValueOnce({ permission: mockPermissions }); // membership.findUniqueOrThrow

    await getGroupMemberPermissions(
      mockRequest as Request,
      mockResponse,
      nextFunction
    );

    expect(mockRequest['_permission']).toBe(mockPermissions);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should reject with 403 when JWT validation fails', async () => {
    vi.mocked(validateJWT).mockReturnValue(null);

    await getGroupMemberPermissions(
      mockRequest as Request,
      mockResponse,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Not authorized',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should reject with 403 when user is not authenticated', async () => {
    vi.mocked(getDataFromAuthenticatedRequest).mockImplementation(() => {
      throw new Error('Not authenticated');
    });

    await getGroupMemberPermissions(
      mockRequest as Request,
      mockResponse,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Not authorized',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should reject with 403 when group is not found', async () => {
    const userId = '123';
    const containerId = '456';

    vi.mocked(getDataFromAuthenticatedRequest).mockReturnValue({
      id: userId,
      uniqueHash: 'hash123',
      email: 'test@example.com',
      tier: 'PRO',
    });
    mockRequest.params = { containerId };

    vi.mocked(fromPrismaV2).mockRejectedValueOnce(new Error('Group not found')); // group.findFirstOrThrow

    await getGroupMemberPermissions(
      mockRequest as Request,
      mockResponse,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Not authorized',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should reject with 403 when membership is not found', async () => {
    const userId = '123';
    const containerId = '456';
    const groupId = '789';

    vi.mocked(getDataFromAuthenticatedRequest).mockReturnValue({
      id: userId,
      uniqueHash: 'hash123',
      email: 'test@example.com',
      tier: 'PRO',
    });
    mockRequest.params = { containerId };

    vi.mocked(fromPrismaV2)
      .mockResolvedValueOnce({ id: groupId }) // group.findFirstOrThrow
      .mockRejectedValueOnce(new Error('Membership not found')); // membership.findUniqueOrThrow

    await getGroupMemberPermissions(
      mockRequest as Request,
      mockResponse,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Not authorized',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
