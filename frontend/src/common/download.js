import { download } from '@/lib/filesync';

export default class Downloader {
  constructor(keychain, api) {
    this.keychain = keychain.value ?? keychain;
    this.api = api;
  }

  async doDownload(id, folderId, wrappedKey, filename) {
    if (!id) {
      console.log(`no id`);
      return;
    }
    if (!folderId) {
      console.log(`no id`);
      return;
    }

    let wrappingKey;
    try {
      wrappingKey = await this.keychain.get(folderId);
    } catch (e) {
      console.log(`cannot unwrap content key - no key for folder`);
      return;
    }

    // could use this so I can display the file size...
    // I'd need to move it
    const { size, type } = await this.api.getUploadMetadata(id);
    if (!size) {
      console.log(`no size`);
      return;
    }

    const contentKey = await this.keychain.container.unwrapContentKey(
      wrappedKey,
      wrappingKey
    );

    try {
      await download(id, size, contentKey, false, filename, type);
      return true;
    } catch (e) {
      return false;
    }
  }
}

// export default async (id, folderId, wrappedKey, filename) => {
//   return await doDownload(id, folderId, wrappedKey, filename);
// };
