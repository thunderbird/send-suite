import { describe, expect, it, vi } from 'vitest';
import {
  checkAllowList,
  generateState,
  getClient,
  getIssuer,
  isEmailInAllowList,
} from '../../auth/client';

describe('Auth Client', () => {
  vi.stubEnv(
    'FXA_ALLOW_LIST',
    '@example.org,@example.com,@example.ai,@examplewatch.com,@examplefoundation.org,@tortillas.com'
  );
  vi.stubEnv('FXA_MOZ_ISSUER', 'https://accounts.stage.mozaws.net');

  describe('generateState', () => {
    it('should generate a random state', () => {
      const state = generateState();
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
    });
  });

  describe('getIssuer', () => {
    it('should return the issuer', async () => {
      const issuer = await getIssuer();
      expect(issuer).toBeDefined();
      expect(issuer.issuer).toBe('https://accounts.stage.mozaws.net');
    });
  });

  describe('getClient', () => {
    it('should return a client', () => {
      const issuer = {
        Client: vi.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-expect-error
      const client = getClient(issuer);
      expect(client).toBeDefined();
      expect(issuer.Client).toHaveBeenCalledWith({
        client_id: process.env.FXA_CLIENT_ID,
        client_secret: process.env.FXA_CLIENT_SECRET,
        redirect_uris: [process.env.FXA_REDIRECT_URI],
        response_types: ['code'],
        scopes: ['openid', 'profile'],
      });
    });
  });

  describe('isEmailInAllowList', () => {
    const allowList = `we_love_bread@example.example,@example.org`.split(',');

    it('should return true on matching domains', () => {
      const email = 'example@example.org';
      const result = isEmailInAllowList(email, allowList);
      expect(result).toBe(true);
    });

    it('should return true on matching unique values', () => {
      const email = 'we_love_bread@example.example';
      const result = isEmailInAllowList(email, allowList);
      expect(result).toBe(true);
    });

    it('should return false when domain is not in list', () => {
      const email = 'example@example.example';
      const result = isEmailInAllowList(email, allowList);
      expect(result).toBe(false);
    });

    it('should return false when email is not uniquely allowed', () => {
      const email = 'james@ham.com';
      const result = isEmailInAllowList(email, allowList);
      expect(result).toBe(false);
    });
  });

  describe('checkAllowList', () => {
    it('should not throw errors when user in allow list', async () => {
      const noErrorHere = await checkAllowList('don@tortillas.com');
      expect(noErrorHere).toBeUndefined();
    });

    it('should throw when user is not in allow list', async () => {
      try {
        await checkAllowList('n@sync.com');
      } catch (error) {
        expect(error.message).toBe('User not in allow list');
      }
    });

    it('should throw when no email is passed', async () => {
      try {
        await checkAllowList('');
      } catch (error) {
        expect(error.message).toBe('checkAllowList requires an email');
      }
    });
  });
});
