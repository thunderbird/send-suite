async function init(user, keychain, folderStore) {
  try {
    await user.load();
  } catch (e) {
    console.log(e);
    console.log(`could not load user`);
    return;
  }
  if (user.id) {
    console.log(`we have a user, attempting to log in`);
    await user.login();
    await folderStore.fetchUserFolders();
  }
  try {
    await keychain.load();

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
  } catch (e) {
    console.log(e);
    console.log(`could not load keys`);
    return;
  }
  console.log(`keychain loaded`);
}

export default init;
