import { getCookie } from '@/utils';
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
