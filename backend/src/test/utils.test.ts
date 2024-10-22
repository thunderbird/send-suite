import { getCookie, getTokenExpiration } from '@/utils';
import { describe, expect, it } from 'vitest';

describe('getCookie', () => {
  it('should return the correct cookie value when present', () => {
    const cookieStr =
      'name=JohnDoe; Authorization=Bearer%20token123; otherCookie=value';
    const result = getCookie(cookieStr, 'Authorization');
    expect(result).toBe('Bearer token123');
  });

  it('should return null if the cookie is not found', () => {
    const cookieStr = 'name=JohnDoe; otherCookie=value';
    const result = getCookie(cookieStr, 'Authorization');
    expect(result).toBeNull();
  });

  it('should return null for an empty cookie string', () => {
    const result = getCookie('', 'Authorization');
    expect(result).toBeNull();
  });

  it('should return null for an empty cookie name', () => {
    const cookieStr = 'name=JohnDoe; Authorization=Bearer%20token123';
    const result = getCookie(cookieStr, '');
    expect(result).toBeNull();
  });

  it('should correctly decode URL-encoded values', () => {
    const cookieStr = 'Authorization=Bearer%20token123';
    const result = getCookie(cookieStr, 'Authorization');
    expect(result).toBe('Bearer token123');
  });
});

describe('getTokenExpiration', () => {
  it('should return correct expiration details for valid days', () => {
    const days = 1;
    const result = getTokenExpiration(days);
    expect(result).toEqual({
      milliseconds: 86_400_000, // 5 days in milliseconds
      stringified: '1d',
    });
  });

  it('should throw an error if days is not a round number', () => {
    const days = 5.5;
    const testFunc = () => getTokenExpiration(days);
    expect(testFunc).toThrow(
      'Token expiration should be a round number specifying days'
    );
  });
});
