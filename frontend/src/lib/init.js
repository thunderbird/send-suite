import { INIT_ERROR } from '@/lockbox/const';
import { User } from '@/lib/user';
import { Keychain } from '@/lib/keychain';

/**
 * Loads user and keychain from storage; creates default folder if necessary.
 * @param {User} user - Instance of User class.
 * @param {Keychain} keychain - Instance of Keychain class.
 * @param {import('pinia').StoreDefinition} folderStore - Pinia store for managing folders.
 */
async function init(user, keychain, folderStore) {
  const hasUser = await user.load();
  const hasKeychain = await keychain.load();

  if (!hasUser) {
    return INIT_ERROR.NO_USER;
  }

  if (!hasKeychain) {
    return INIT_ERROR.NO_KEYCHAIN;
  }

  await folderStore.sync();
  if (!folderStore.defaultFolder) {
    const createFolderResp = await folderStore.createFolder();
    if (!createFolderResp?.id) {
      return INIT_ERROR.COULD_NOT_CREATE_DEFAULT_FOLDER;
    }
  }

  return INIT_ERROR.NONE;
}

export default init;
