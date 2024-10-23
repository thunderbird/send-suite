import { INIT_ERRORS } from '@/apps/lockbox/const';
import { FolderStore } from '@/apps/lockbox/stores/folder-store.types';
import { Keychain } from '@/lib/keychain';
import { UserStore } from '@/stores/user-store';

/**
 * Loads user and keychain from storage; creates default folder if necessary.
 * @param {UserStore} userStore - Pinia store for managing user.
 * @param {Keychain} keychain - Instance of Keychain class.
 * @param {FolderStore} folderStore - Pinia store for managing folders.
 * @return {Promise<INIT_ERRORS>} - Returns Promise of 0 (success) or an error code typed by INIT_ERRORS.
 */
async function init(
  userStore: UserStore,
  keychain: Keychain,
  folderStore: FolderStore
): Promise<INIT_ERRORS> {
  const hasUser = await userStore.loadFromLocalStorage();
  const hasKeychain = await keychain.load();

  if (!hasUser) {
    return INIT_ERRORS.NO_USER;
  }

  if (!hasKeychain) {
    return INIT_ERRORS.NO_KEYCHAIN;
  }

  await folderStore.sync();
  if (!folderStore?.defaultFolder) {
    const createFolderResp = await folderStore.createFolder();
    if (!createFolderResp?.id) {
      return INIT_ERRORS.COULD_NOT_CREATE_DEFAULT_FOLDER;
    }
  }

  return INIT_ERRORS.NONE;
}

export default init;
