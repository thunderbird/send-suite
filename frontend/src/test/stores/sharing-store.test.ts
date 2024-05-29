import { expect, describe, it, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import useSharingStore from '@/apps/lockbox/stores/sharing-store';

import Sharer from '@/lib/share';
import { Util } from '@/lib/keychain';

const URL = 'http://just.kidding';

vi.mock('@/lib/share', () => {
  const Sharer = vi.fn();

  // Must use .prototype, otherwise `sharing-store` can
  // not access `shareItemsWithPassword` on the instance of Sharer.
  Sharer.prototype.shareItemsWithPassword = vi
    .fn()
    .mockImplementation(() => URL);

  return {
    default: Sharer,
  };
});

describe(`Sharing Store`, () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe(`shareItems`, () => {
    it(`appends a generated password hash if a blank one is provided`, async () => {
      const sharingStore = useSharingStore();

      const itemsArray = [
        {
          id: 123,
          name: 'fake file',
          uploadId: 'abc123',
        },
      ];
      const password = '';

      // Set up mocks/spies prior before they are called by sharingStore.shareItems()
      const mockUtil = vi.spyOn(Util, 'generateRandomPassword');
      const mockShareItemsWithPassword =
        vi.mocked(Sharer).mock.instances[0].shareItemsWithPassword;

      const result = await sharingStore.shareItems(itemsArray, password);

      // Retrieve value after sharingStore.shareItems() is called
      const expectedPasswordHash = mockUtil.mock.results[0].value;

      expect(mockShareItemsWithPassword).toHaveBeenCalledWith(
        itemsArray,
        expectedPasswordHash
      );
      expect(result).toBe(`${URL}#${expectedPasswordHash}`);
    });

    it(`does not append a password hash if one is provided`, async () => {
      const sharingStore = useSharingStore();
      const itemsArray = [
        {
          id: 123,
          name: 'fake file',
          uploadId: 'abc123',
        },
      ];
      const password = 'abcdefg1234567';

      const mockShareItemsWithPassword =
        vi.mocked(Sharer).mock.instances[0].shareItemsWithPassword;
      const result = await sharingStore.shareItems(itemsArray, password);

      expect(mockShareItemsWithPassword).toHaveBeenCalledWith(
        itemsArray,
        password
      );
      expect(result).toBe(`${URL}`);
    });

    it(`returns null when shareItemsWithPassword fails`, async () => {
      const sharingStore = useSharingStore();
      const itemsArray = [
        {
          id: 123,
          name: 'fake file',
          uploadId: 'abc123',
        },
      ];
      const password = 'abcdefg1234567';

      const mockShareItemsWithPassword =
        vi.mocked(Sharer).mock.instances[0].shareItemsWithPassword;
      vi.mocked(mockShareItemsWithPassword).mockResolvedValue(null);
      const result = await sharingStore.shareItems(itemsArray, password);

      expect(mockShareItemsWithPassword).toHaveBeenCalledWith(
        itemsArray,
        password
      );
      expect(result).toBeNull();
    });
  });
});
