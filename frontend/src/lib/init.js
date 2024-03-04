import { INIT_ERRORS } from '@/lockbox/const';
import { User } from '@/lib/user';
import { Keychain } from '@/lib/keychain';

/**
 * Loads user and keychain from storage; creates default folder if necessary.
 * @param {User} user - Instance of User class.
 * @param {Keychain} keychain - Instance of Keychain class.
 * @param {import('pinia').StoreDefinition} folderStore - Pinia store for managing folders.
 * @return {INIT_ERRORS} - Returns 0 (success) or an error code typed by INIT_ERRORS.
 */
async function init(user, keychain, folderStore) {
  const hasUser = await user.load();
  const hasKeychain = await keychain.load();

  if (!hasUser) {
    return INIT_ERRORS.NO_USER;
  }

  if (!hasKeychain) {
    return INIT_ERRORS.NO_KEYCHAIN;
  }

  await folderStore.sync();
  if (!folderStore.defaultFolder) {
    const createFolderResp = await folderStore.createFolder();
    if (!createFolderResp?.id) {
      return INIT_ERRORS.COULD_NOT_CREATE_DEFAULT_FOLDER;
    }
  }

  return INIT_ERRORS.NONE;
}

export default init;
