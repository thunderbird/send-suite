import { sendBlob } from '@/lib/filesync';

export default class Uploader {
  constructor(user, keychain, api) {
    this.user = user.value ?? user;
    this.keychain = keychain.value ?? keychain;
    this.api = api;
  }

  async doUpload(fileBlob, containerId, isText = true) {
    if (!containerId) {
      console.log(`cannot upload - no folder selected`);
      // emit('uploadAborted');
      return null;
    }

    if (!fileBlob) {
      console.log(`cannot upload - no file blob provided`);
      // emit('uploadAborted');
      return null;
    }

    // get folder key
    const wrappingKey = await this.keychain.get(containerId);
    if (!wrappingKey) {
      console.log(`cannot upload - no key for conversation`);
    }

    // generate new AES key for the uploaded Content
    const key = await this.keychain.content.generateKey();

    // wrap the key for inclusion with the Item
    const wrappedKeyStr = await this.keychain.container.wrapContentKey(
      key,
      wrappingKey
    );

    const blob = fileBlob;
    const filename = blob.name;

    const id = await sendBlob(blob, key);
    if (!id) {
      console.log(`could not upload`);
      return;
    }
    console.log(`🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀`);
    console.log(blob.type);
    const uploadResp = await this.api.createContent(
      id,
      blob.size,
      this.user.id,
      blob.type
    );
    console.log(uploadResp);

    if (id !== uploadResp.id) {
      debugger;
    }

    const itemObj = await this.api.createItemInContainer(
      id,
      containerId,
      filename,
      isText ? 'MESSAGE' : 'FILE',
      wrappedKeyStr
    );
    console.log(`🎉 here it is...`);
    console.log(itemObj);
    // emit('uploadComplete', itemObj);
    return itemObj;
  }
}
