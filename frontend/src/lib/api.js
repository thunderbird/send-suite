import { timestamp } from './utils';
import { CONTAINER_TYPE, ITEM_TYPE } from './const';

export class ApiConnection {
  constructor(serverUrl) {
    // using new URL() trims off excess whitespace and trailing '/'
    const u = new URL(serverUrl);
    this.serverUrl = u.origin;
  }

  toString() {
    return this.serverUrl;
  }

  async callApi(path, body = {}, method = 'GET') {
    const url = `${this.serverUrl}/api/${path}`;
    const opts = {
      mode: 'cors',
      method,
      headers: { 'content-type': 'application/json' },
    };

    if (method.trim().toUpperCase() === 'POST') {
      opts.body = JSON.stringify({
        ...body,
      });
    }

    const resp = await fetch(url, opts);

    if (!resp.ok) {
      return null;
    }
    return resp.json();
  }

  async createUpload(id, size, ownerId) {
    // TODO: remove ownerId as arg
    // the backend should get this from session
    const resp = await this.callApi(
      'uploads',
      {
        id,
        size,
        ownerId,
      },
      'POST'
    );
    if (resp) {
      return resp.upload;
    } else {
      console.log(`Error: Unable to create Upload.`);
      return null;
    }
  }

  async getUploadSize(id) {
    const resp = await this.callApi(`uploads/${id}/size`);
    if (resp) {
      return resp.size;
    } else {
      console.log(`Error: Could not get size of ${id}.`);
      return null;
    }
  }

  async createItemInContainer(uploadId, containerId, name, type) {
    const resp = await this.callApi(
      `containers/${containerId}`,
      {
        uploadId,
        name,
        type,
      },
      'POST'
    );
    if (resp) {
      return resp;
    } else {
      console.log(`Error: Unable to create Item.`);
      return null;
    }
  }

  async getContainerWithItems(containerId) {
    const resp = await this.callApi(`containers/${containerId}`);
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not get container ${containerId}`);
      return null;
    }
  }

  async createConversation(ownerId, publicKey, name) {
    // TODO: shift the userId from frontend argument to backend session
    const resp = await this.callApi(
      `containers`,
      {
        name: name ?? timestamp(),
        publicKey,
        ownerId,
        type: CONTAINER_TYPE.CONVERSATION,
      },
      'POST'
    );
    if (resp) {
      return resp.container;
    } else {
      console.log(`Error: could not create conversations for user ${ownerId}`);
      return null;
    }
  }

  async createFolder(ownerId, publicKey, name) {
    // TODO: shift the userId from frontend argument to backend session
    const resp = await this.callApi(
      `containers`,
      {
        name: name ?? timestamp(),
        publicKey,
        ownerId,
        type: CONTAINER_TYPE.FOLDER,
      },
      'POST'
    );
    if (resp) {
      return resp.container;
    } else {
      console.log(`Error: could not create folder for user ${ownerId}`);
      return null;
    }
  }

  async addMemberToContainer(userId, containerId) {
    const resp = await this.callApi(
      `containers/${containerId}/member`,
      {
        userId,
      },
      'POST'
    );
    if (resp) {
      return resp;
    } else {
      console.log(
        `Error: could not add user ${ownerId} to container ${containerId}`
      );
      return null;
    }
  }

  async removeMemberFromGroup(userId, containerId) {
    const resp = await this.callApi(
      `containers/${containerId}/member`,
      {
        userId,
      },
      'DELETE'
    );
    if (resp) {
      return resp;
    } else {
      console.log(
        `Error: could not remove user ${ownerId} from container ${containerId}`
      );
      return null;
    }
  }

  async getAllConversations(userId) {
    // TODO: shift the userId from frontend argument to backend session
    const resp = await this.callApi(`users/${userId}/conversations/`);
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not get conversations for user ${userId}`);
      return null;
    }
  }

  async getAllFolders(userId) {
    // TODO: shift the userId from frontend argument to backend session
    const resp = await this.callApi(`users/${userId}/folders/`);
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not get folders for user ${userId}`);
      return null;
    }
  }
}
