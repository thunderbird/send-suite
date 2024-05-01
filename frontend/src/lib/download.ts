import { getBlob } from '@/lib/filesync';
import { Keychain } from '@/lib/keychain';
import { ApiConnection } from '@/lib/api';

export default class Downloader {
  keychain: Keychain;
  api: ApiConnection;
  constructor(keychain: Keychain, api: ApiConnection) {
    this.keychain = keychain;
    this.api = api;
  }

  async doDownload(
    id: string,
    folderId: number,
    wrappedKeyStr: string,
    filename: string
  ): Promise<boolean> {
    if (!id) {
      return false;
    }
    if (!folderId) {
      return false;
    }
    let wrappingKey: CryptoKey;
    try {
      wrappingKey = await this.keychain.get(folderId);
    } catch (e) {
      console.log(`cannot unwrap content key - no key for folder`);
      return false;
    }

    // Get necessary metadata
    const { size, type } = await this.api.call(`uploads/${id}/metadata`);
    if (!size) {
      return false;
    }

    const contentKey: CryptoKey =
      await this.keychain.container.unwrapContentKey(
        wrappedKeyStr,
        wrappingKey
      );

    try {
      await getBlob(id, size, contentKey, false, filename, type);
      return true;
    } catch (e) {
      return false;
    }
  }
}
