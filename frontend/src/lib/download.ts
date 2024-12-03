import { ApiConnection } from '@/lib/api';
import { getBlob } from '@/lib/filesync';
import { Keychain } from '@/lib/keychain';

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
      return false;
    }

    // Get necessary metadata
    const { size, type } = await this.api.call<{
      size: number;
      type: string;
    }>(`uploads/${id}/metadata`);
    if (!size) {
      return false;
    }

    const contentKey: CryptoKey =
      await this.keychain.container.unwrapContentKey(
        wrappedKeyStr,
        wrappingKey
      );

    try {
      await getBlob(id, size, contentKey, false, filename, type, this.api);
      return true;
    } catch (e) {
      return false;
    }
  }
}
