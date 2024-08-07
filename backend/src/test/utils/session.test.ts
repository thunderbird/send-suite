import { Request } from 'express';
import { describe, expect, it } from 'vitest';
import {
  getSessionUserOrThrow,
  getUniqueHash,
  getUniqueHashFromAnonId,
} from '../../utils/session';

describe('getUniqueHash', () => {
  it('should return the hashed email if it exists in the session', () => {
    const req = {
      session: {
        user: {
          uniqueHash: 'uniqueHash123',
        },
      },
    } as Request;

    const result = getUniqueHash(req);

    expect(result).toBe('uniqueHash123');
  });

  it('should return undefined if the hashed email does not exist in the session', () => {
    const req = {
      session: {
        user: {},
      },
    } as Request;

    const result = getUniqueHash(req);

    expect(result).toBeUndefined();
  });

  it('should return undefined if the session does not exist', () => {
    const req = {} as Request;

    const result = getUniqueHash(req);

    expect(result).toBeUndefined();
  });
});

describe('getUniqueHashFromAnonId', () => {
  it('should return a unique prefix', () => {
    const anonId = 'test_id';
    const expectedPrefix = `f'anon-`;
    const result = getUniqueHashFromAnonId(anonId);

    // Check if the result starts with the expected prefix
    expect(result.startsWith(expectedPrefix)).toBe(true);

    // Check if the length of the hash (excluding the prefix) is correct for a sha256 hash
    expect(result.length).toBe(expectedPrefix.length + 64); // sha256 hash is 64 characters long
  });
});

describe('getSessionUserOrThrow', () => {
  it('should return a user from session', () => {
    const req = {
      session: {
        user: {
          id: 1,
          email: 'something@somethin.com',
        },
      },
    } as Request;

    expect(() => {
      getSessionUserOrThrow(req);
    }).not.toThrow();

    const result = getSessionUserOrThrow(req);
    expect(result).toEqual(req.session.user);
  });

  it('should throw an error if the session does not exist', () => {
    const req = {} as Request;

    expect(() => {
      getSessionUserOrThrow(req);
    }).toThrow();
  });

  it('should throw an error if the user does not exist in the session', () => {
    const req = {
      session: {},
    } as Request;

    expect(() => {
      getSessionUserOrThrow(req);
    }).toThrow();
  });
});
