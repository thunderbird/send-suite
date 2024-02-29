import { Util } from '@/lib/keychain';
import { CONTAINER_TYPE } from '@/lib/const';

export default class Sharer {
  constructor(user, keychain, api) {
    this.user = user;
    this.keychain = keychain;
    this.api = api;
  }

  // Creates AccessLink
  async shareItemsWithPassword(items, password) {
    const containerId = await this.createShareOnlyContainer(items, null, this.user.id);
    return await this.requestAccessLink(containerId, password);
  }

  // Creates AccessLink
  async shareContainerWithPassword(containerId, password) {
    return await this.requestAccessLink(containerId, password);
  }

  // Creates Invitation
  async shareContainerWithInvitation(containerId, email) {
    let user = await this.api.getUserByEmail(email);

    if (user) {
      let { publicKey, id: recipientId } = user;
      if (!publicKey) {
        console.log(`Could not find public key for user ${email}`);
      }

      console.warn('SOMETHING WEIRD IS HAPPENING WITH PUBLIC KEYS ON SERVER');

      // TODO: make sure we're not double-escaping before storing on server
      while (typeof publicKey !== 'object') {
        publicKey = JSON.parse(publicKey);
      }

      const importedPublicKey = await crypto.subtle.importKey(
        'jwk',
        publicKey,
        {
          name: 'RSA-OAEP',
          hash: { name: 'SHA-256' },
        },
        true,
        ['wrapKey']
      );

      const key = await this.keychain.get(containerId);
      const wrappedKey = await this.keychain.rsa.wrapContainerKey(key, importedPublicKey);

      if (!wrappedKey) {
        console.log(`no wrapped key for the invitation`);
        return null;
      }

      const resp = await this.api.inviteGroupMember(containerId, wrappedKey, recipientId, this.user.id);
      console.log(`Invitation creation response:`);
      console.log(resp);
      return resp;
    }
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
  async createShareOnlyContainer(items = [], containerId = null) {
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

    // A share-only Folder shouldn't
    // have a parentId
    const parentId = 0;
    const shareOnly = true;

    const response = await api.callApi(
      `containers`,
      {
        name: currentContainer.name,
        type: CONTAINER_TYPE.FOLDER,
        parentId,
        shareOnly,
      },
      'POST'
    );
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
        const contentKey = await this.keychain.container.unwrapContentKey(wrappedKey, currentWrappingKey);

        // wrap the content key with the new container key
        const newWrappingKey = await this.keychain.get(newContainerId);

        const wrappedKeyStr = await this.keychain.container.wrapContentKey(contentKey, newWrappingKey);

        // create the new item with the existing uploadId
        // in the newContainer

        const itemResp = await this.api.callApi(
          `containers/${newContainerId}/item`,
          {
            uploadId,
            name: filename,
            type,
            wrappedKey: wrappedKeyStr,
          },
          'POST'
        );
        console.log(`🎉 here it is...`);
        console.log(itemResp);
        return itemResp;
      })
    );

    return newContainerId;
  }

  async requestAccessLink(containerId, password, expiration) {
    // get the key (which unwraps it),
    console.log(`using password: ${password}`);
    const unwrappedKey = await this.keychain.get(containerId);

    // and password protect it
    const salt = Util.generateSalt();
    const passwordWrappedKeyStr = await this.keychain.password.wrapContainerKey(unwrappedKey, password, salt);

    const challengeKey = await this.keychain.challenge.generateKey();
    const challengeSalt = Util.generateSalt();

    const passwordWrappedChallengeKeyStr = await this.keychain.password.wrapContentKey(
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

    const resp = await this.api.createAccessLink(
      containerId,
      passwordWrappedKeyStr,
      saltStr,
      passwordWrappedChallengeKeyStr,
      challengeSaltStr,
      this.user.id,
      challengePlaintext,
      challengeCiphertext,
      expiration
    );

    if (!resp.id) {
      return null;
    }

    console.log(`created share link for container ${containerId}`);
    const accessLink = resp.id;
    console.log(resp);
    const { origin } = new URL(window.location.href);
    // const url = `${origin}/share/${accessLink}`;
    // TODO: need the server url from...elsewhere
    // Using `origin` works fine for web application, but not for extension
    const url = `http://localhost:5173/share/${accessLink}`;
    return url;
  }
}
