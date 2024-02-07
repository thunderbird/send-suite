async function init(user, keychain, folderStore) {
  try {
    await user.load();
  } catch (e) {
    console.log(e);
    console.log(`could not load user`);
    return;
  }

  if (user.id) {
    console.log(`we have user with id ${user.id}, attempting to log in`);
    await user.login();
    await folderStore.fetchUserFolders();
  }
  try {
    await keychain.load();
  } catch (e) {
    console.log(e);
    console.log(`could not load keychain`);
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
