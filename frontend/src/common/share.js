import { Util } from '@/lib/keychain';

export default class Sharer {
  constructor(user, keychain, api) {
    this.user = user.value ?? user;
    this.keychain = keychain.value ?? keychain;
    this.api = api;
  }

  async doShare(items, password) {
    const containerId = await this.createNewShare(items, null, this.user.id);
    return await this.requestShareLink(containerId, password);
  }

  /*
  Each item in items[] should have:
  {
    containerId | folderId,
    name | filename
    uploadId,
    wrappedKey,
    type
  }

  */
  async createNewShare(items = [], containerId = null, userId = null) {
    if (!userId) {
      console.log(`User ID is required`);
      return;
    }

    if (items.length === 0 && !containerId) {
      console.log(`Nothing is being shared`);
      return;
    }

    // Arbitrarily picked keychain.value.store to
    // confirm presence of keychain
    if (!this.api && !this.keychain.store) {
      console.log(`Need access to api and keychain`);
      return;
    }

    let itemsToShare = [...items];

    let currentContainer = { name: 'untitled' };
    if (containerId) {
      currentContainer = await this.api.getContainerInfo(containerId);
      // TODO: future enhancement
      // If there are no itemsToShare, get the items from the `currentContainer`
      // if (itemsToShare.length > 0) {
      // const { items } = await api.getContainerWithItems(containerId);
      // itemsToShare = items;
      // }
    }

    const response = await this.api.createFolder(userId, currentContainer.name);
    if (!(response || response.id)) {
      console.log(`could not create a new container for items`);
      return null;
    }

    const { id: newContainerId } = response;
    await this.keychain.newKeyForContainer(newContainerId);
    await this.keychain.store();

    await Promise.all(
      itemsToShare.map(async (item) => {
        // TODO: locate source of "folderId" property
        // rename to more generic "containerId"
        const containerId = item.containerId ?? item.folderId;
        // TODO: locate source of "filename" property
        // rename to more generic "name"
        const filename = item.name ?? item.filename;
        const currentWrappingKey = await this.keychain.get(containerId);
        const { uploadId, wrappedKey, type } = item;
        const contentKey = await this.keychain.container.unwrapContentKey(
          wrappedKey,
          currentWrappingKey
        );

        // wrap the content key with the new container key
        const newWrappingKey = await this.keychain.get(newContainerId);

        const wrappedKeyStr = await this.keychain.container.wrapContentKey(
          contentKey,
          newWrappingKey
        );

        // create the new item with the existing uploadId
        // in the newContainer
        const itemResp = await this.api.createItemInContainer(
          uploadId,
          newContainerId,
          filename,
          type,
          wrappedKeyStr
        );

        console.log(`🎉 here it is...`);
        console.log(itemResp);
        return itemResp;
      })
    );

    return newContainerId;
  }

  async requestShareLink(containerId, password) {
    // get the key (which unwraps it),
    console.log(`using password: ${password}`);
    const unwrappedKey = await this.keychain.get(containerId);

    // and password protect it
    const salt = Util.generateSalt();
    const passwordWrappedKeyStr = await this.keychain.password.wrapContainerKey(
      unwrappedKey,
      password,
      salt
    );

    const challengeKey = await this.keychain.challenge.generateKey();
    const challengeSalt = Util.generateSalt();

    const passwordWrappedChallengeKeyStr =
      await this.keychain.password.wrapContentKey(
        challengeKey,
        password,
        challengeSalt
      );

    const challengePlaintext = this.keychain.challenge.createChallenge();

    const challengeCiphertext = await this.keychain.challenge.encryptChallenge(
      challengePlaintext,
      challengeKey,
      challengeSalt
    );

    // convert salts to base64 strings
    const saltStr = Util.arrayBufferToBase64(salt);
    const challengeSaltStr = Util.arrayBufferToBase64(challengeSalt);

    const resp = await this.api.createEphemeralLink(
      containerId,
      passwordWrappedKeyStr,
      saltStr,
      passwordWrappedChallengeKeyStr,
      challengeSaltStr,
      this.user.id,
      challengePlaintext,
      challengeCiphertext
    );

    if (!resp.id) {
      return null;
    }

    console.log(`created share link for container ${containerId}`);
    const hash = resp.id;
    const { origin } = new URL(window.location.href);
    // const url = `${origin}/share/${hash}`;
    // TODO: need the server url from...elsewhere
    const url = `http://localhost:5173/share/${hash}`;
    return url;
  }
}
