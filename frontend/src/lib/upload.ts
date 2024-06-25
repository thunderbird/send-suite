import {
  Item,
  ItemResponse,
  UploadResponse,
} from '@/apps/lockbox/stores/folder-store.types';
import { ApiConnection } from '@/lib/api';
import { NamedBlob, sendBlob } from '@/lib/filesync';
import { Keychain } from '@/lib/keychain';
import { retryUntilSuccessOrTimeout } from '@/lib/utils';
import { UserType } from '@/types';

export default class Uploader {
  user: UserType;
  keychain: Keychain;
  api: ApiConnection;
  constructor(user: UserType, keychain: Keychain, api: ApiConnection) {
    this.user = user;
    // Even though we only need the user.id, we must receive the entire,
    // reactive `user` object. This gives enough time for it to "hydrate"
    // from an existing session or to populate from an initial login.
    this.keychain = keychain;
    this.api = api;
  }

  async doUpload(
    fileBlob: NamedBlob,
    containerId: number,
    isText = true
  ): Promise<Item> {
    if (!containerId) {
      return null;
    }

    if (!fileBlob) {
      return null;
    }

    // get folder key
    const wrappingKey = await this.keychain.get(containerId);
    if (!wrappingKey) {
      return null;
    }

    // generate new AES key for the uploaded Content
    const key = await this.keychain.content.generateKey();

    // wrap the key for inclusion with the Item
    const wrappedKeyStr = await this.keychain.container.wrapContentKey(
      key,
      wrappingKey
    );

    const blob = fileBlob as NamedBlob;
    const filename = blob.name;

    // Blob is encrypted as it is uploaded through a websocket connection
    const id = await sendBlob(blob, key);
    if (!id) {
      return null;
    }

    await retryUntilSuccessOrTimeout(
      async () => {
        await this.api.call(`uploads/${id}/stat`);
      },
      1000,
      5000
    );

    // Create a Content entry in the database
    const result = await this.api.call<{
      upload: UploadResponse;
    }>(
      'uploads',
      {
        id: id,
        size: blob.size,
        ownerId: this.user.id,
        type: blob.type,
        containerId,
      },
      'POST'
    );
    if (!result) {
      return null;
    }
    const upload = result.upload;
    // For the Content entry, create the corresponding Item in the Container
    const itemObj = await this.api.call<ItemResponse>(
      `containers/${containerId}/item`,
      {
        uploadId: upload.id,
        name: filename,
        type: isText ? 'MESSAGE' : 'FILE',
        wrappedKey: wrappedKeyStr,
      },
      'POST'
    );
    return {
      ...itemObj,
      upload: {
        size: blob.size,
        type: blob.type,
      },
    };
  }
}
