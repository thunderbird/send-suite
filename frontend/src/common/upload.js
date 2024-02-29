import { sendBlob } from '@/lib/filesync';

export default class Uploader {
  constructor(user, keychain, api) {
    this.user = user;
    // Even though we only need the user.id, we must receive the entire,
    // reactive `user` object. This gives enough time for it to "hydrate"
    // from an existing session or to populate from an initial login.
    this.keychain = keychain;
    this.api = api;
  }

  async doUpload(fileBlob, containerId, isText = true) {
    if (!containerId) {
      console.log(`cannot upload - no folder selected`);
      return null;
    }

    if (!fileBlob) {
      console.log(`cannot upload - no file blob provided`);
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
    const wrappedKeyStr = await this.keychain.container.wrapContentKey(key, wrappingKey);

    const blob = fileBlob;
    const filename = blob.name;

    // Blob is encrypted as it is uploaded through a websocket connection
    const id = await sendBlob(blob, key);
    if (!id) {
      console.log(`could not upload Content`);
      return;
    }
    console.log(`🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀`);
    console.log(blob.type);

    // Create a Content entry in the database
    const { upload } = await this.api.callApi(
      'uploads',
      {
        id: id,
        size: blob.size,
        ownerId: this.user.id,
        type: blob.type,
      },
      'POST'
    );

    if (!upload) {
      console.log(`could not create Content entity in database`);
      return;
    }

    // For the Content entry, create the corresponding Item in the Container
    const itemObj = await this.api.callApi(
      `containers/${containerId}/item`,
      {
        uploadId: upload.id,
        name: filename,
        type: isText ? 'MESSAGE' : 'FILE',
        wrappedKey: wrappedKeyStr,
      },
      'POST'
    );
    console.log(`🎉 here it is...`);
    console.log(itemObj);
    return {
      ...itemObj,
      upload: {
        size: blob.size,
        type: blob.type,
      },
    };
  }
}
