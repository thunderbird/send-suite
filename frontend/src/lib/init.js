import { INIT_ERROR } from '@/lockbox/const';

// Returns true if init finished, otherwise false
async function init(user, keychain, folderStore) {
  let hasUser = await user.load();
  let hasKeychain = await keychain.load();

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
