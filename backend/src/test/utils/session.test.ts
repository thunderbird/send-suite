import { describe, expect, it } from 'vitest';
import { getHashedEmail } from '../../utils/session';

describe('getHashedEmail', () => {
  it('should return the hashed email if it exists in the session', () => {
    const req = {
      session: {
        user: {
          hashedEmail: 'hashedEmail123',
        },
      },
    };

    const result = getHashedEmail(req);

    expect(result).toBe('hashedEmail123');
  });

  it('should return undefined if the hashed email does not exist in the session', () => {
    const req = {
      session: {
        user: {},
      },
    };

    const result = getHashedEmail(req);

    expect(result).toBeUndefined();
  });

  it('should return undefined if the session does not exist', () => {
    const req = {};

    const result = getHashedEmail(req);

    expect(result).toBeUndefined();
  });
});
