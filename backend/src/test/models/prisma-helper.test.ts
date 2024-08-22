import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fromPrismaV2 } from '../../models/prisma-helper'; // Adjust the import path as necessary

describe('fromPrismaV2', () => {
  const exampleFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the result of the Prisma function when successful', async () => {
    const expectedResult = { data: 'Success' };
    exampleFn.mockResolvedValue(expectedResult);

    const result = await fromPrismaV2(exampleFn, {
      query: 'SELECT * FROM users',
    });

    expect(result).toEqual(expectedResult);
    expect(exampleFn).toHaveBeenCalledWith({ query: 'SELECT * FROM users' });
  });

  it('should throw specified string error', async () => {
    const expectedResult = { data: 'Baaaad' };
    exampleFn.mockRejectedValue(expectedResult);

    try {
      await fromPrismaV2(
        exampleFn,
        {
          query: 'SELECT * FROM users',
        },
        'BaseError'
      );
    } catch (error) {
      expect(error.message).toEqual('BaseError');
    }

    expect(exampleFn).toHaveBeenCalledWith({ query: 'SELECT * FROM users' });
  });

  it('should throw specified callback error', async () => {
    const expectedResult = { data: 'Baaaad' };
    exampleFn.mockRejectedValue(expectedResult);

    try {
      await fromPrismaV2(
        exampleFn,
        {
          query: 'SELECT * FROM users',
        },
        () => {
          throw new Error('Triggered error');
        }
      );
    } catch (error) {
      expect(error.message).toEqual('Triggered error');
    }

    expect(exampleFn).toHaveBeenCalledWith({ query: 'SELECT * FROM users' });
  });

  it('should throw base error if no callback passed', async () => {
    const err = new Error('Le bad error');
    exampleFn.mockRejectedValue(err);

    try {
      expect(
        await fromPrismaV2(exampleFn, {
          query: 'SELECT * FROM users',
        })
      ).toThrowError(err);
    } catch (error) {
      expect(error.message).toEqual('Error');
    }

    expect(exampleFn).toHaveBeenCalledWith({ query: 'SELECT * FROM users' });
  });
});
