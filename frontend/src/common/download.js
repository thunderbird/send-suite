import { download } from '@/lib/filesync';

export default class Downloader {
  constructor(keychain, api) {
    this.keychain = keychain;
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

    // Need the size for download.
    // Need the type for saving the file.
    const { size, type } = await this.api.callApi(`uploads/${id}/metadata`);
    if (!size) {
      console.log(`no size`);
      return;
    }

    const contentKey = await this.keychain.container.unwrapContentKey(wrappedKey, wrappingKey);

    try {
      await download(id, size, contentKey, false, filename, type);
      return true;
    } catch (e) {
      return false;
    }
  }
}
