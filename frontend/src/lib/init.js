// Returns true if init finished, otherwise false
async function init(user, keychain, folderStore) {
  let hasUser = await user.load();
  let hasKeychain = await keychain.load();

  if (!hasUser || !hasKeychain) {
    console.log(`Need to log in or create a user`);
    return false;
  }
  await folderStore.sync();
  if (!folderStore.defaultFolder) {
    const createFolderResp = await folderStore.createFolder();
    if (!createFolderResp?.id) {
      alert(`DEBUG: could not create a default`);
    }
  }

  return true;
}

export default init;
