async function init(user, keychain, folderStore) {
  let hasUser = await user.load();
  let hasKeychain = await keychain.load();

  if (!hasUser || !hasKeychain) {
    console.log(`Need to log in or create a user`);
    return;
  }

  if (!folderStore.defaultFolder) {
    // Creating a default folder
    console.log(`creating default folder`);
    const createFolderResp = await folderStore.createFolder();
    console.log(createFolderResp);
    if (createFolderResp) {
      console.log(`👍👍👍👍👍👍👍👍👍👍👍 created a folder`);
    } else {
      console.log(`could not create a folder 🐓🐓🐓🐓🐓🐓🐓🐓🐓🐓🐓`);
    }
  }
}

export default init;
