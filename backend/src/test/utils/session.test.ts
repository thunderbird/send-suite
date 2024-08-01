import { describe, expect, it } from 'vitest';
import { getUniqueHash, getUniqueHashFromAnonId } from '../../utils/session';

describe('getUniqueHash', () => {
  it('should return the hashed email if it exists in the session', () => {
    const req = {
      session: {
        user: {
          uniqueHash: 'uniqueHash123',
        },
      },
    };

    const result = getUniqueHash(req);

    expect(result).toBe('uniqueHash123');
  });

  it('should return undefined if the hashed email does not exist in the session', () => {
    const req = {
      session: {
        user: {},
      },
    };

    const result = getUniqueHash(req);

    expect(result).toBeUndefined();
  });

  it('should return undefined if the session does not exist', () => {
    const req = {};

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
