import * as jwt from '@/auth/jwt';
import { TRPCError } from '@trpc/server';
import { describe, expect, it, vi } from 'vitest';
import { getGroupMemberPermission, isAuthed } from '../../trpc/middlewares';

vi.mock('@/auth/jwt', () => ({
  validateJWT: vi.fn(),
}));

describe('Middleware tests', () => {
  const mockNext = vi.fn();
  const mockCtx = {
    cookies: {
      jwtToken: 'mock-jwt-token',
      jwtRefreshToken: 'mock-refresh-token',
    },
    user: {
      id: null,
      email: null,
      uniqueHash: null,
    },
  };

  describe('isAuthed middleware', () => {
    it('should call next() when JWT is valid', async () => {
      vi.mocked(jwt.validateJWT).mockReturnValue('valid');

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      await isAuthed({ ctx: mockCtx, next: mockNext });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw UNAUTHORIZED error when token needs refresh', async () => {
      vi.mocked(jwt.validateJWT).mockReturnValue('shouldRefresh');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      await expect(isAuthed({ ctx: mockCtx, next: mockNext })).rejects.toThrow(
        new TRPCError({ code: 'UNAUTHORIZED' })
      );
    });

    it('should throw FORBIDDEN error when validation fails', async () => {
      vi.mocked(jwt.validateJWT).mockReturnValue(null);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      await expect(isAuthed({ ctx: mockCtx, next: mockNext })).rejects.toThrow(
        new TRPCError({ code: 'FORBIDDEN' })
      );
    });
  });

  describe('getGroupMemberPermission middleware', () => {
    it('should call next()', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      await getGroupMemberPermission({ ctx: mockCtx, next: mockNext });
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
