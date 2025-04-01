import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDomainName } from './clientConfig';

// Mock the import.meta.env
beforeEach(() => {
  vi.stubGlobal('import.meta', {
    env: {
      MODE: 'development',
      BASE_URL: '/',
      VITE_SEND_CLIENT_URL: 'http://localhost:3000',
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('clientConfig', () => {
  describe('getDomainName', () => {
    it('should remove http protocol and return domain', () => {
      expect(getDomainName('http://example.com')).toBe('example.com');
    });

    it('should remove https protocol and return domain', () => {
      expect(getDomainName('https://example.com')).toBe('example.com');
    });

    it('should remove www. prefix and return domain', () => {
      expect(getDomainName('www.example.com')).toBe('example.com');
    });

    it('should remove both protocol and www prefix', () => {
      expect(getDomainName('https://www.example.com')).toBe('example.com');
    });

    it('should strip port numbers', () => {
      expect(getDomainName('example.com:3000')).toBe('example.com');
    });

    it('should handle domains with subdomains', () => {
      expect(getDomainName('https://sub.example.com')).toBe('sub.example.com');
    });

    it('should handle domains with protocol, www, and port', () => {
      expect(getDomainName('https://www.example.com:3000')).toBe('example.com');
    });
  });
});
