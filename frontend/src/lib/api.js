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
      credentials: 'include',
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

  async createContent(id, size, ownerId, type) {
    // TODO: remove ownerId as arg
    // the backend should get this from session
    const resp = await this.callApi(
      'uploads',
      {
        id,
        size,
        ownerId,
        type,
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

  async getUploadMetadata(id) {
    const resp = await this.callApi(`uploads/${id}/metadata`);
    if (resp) {
      return resp;
    } else {
      console.log(`Error: Could not get size of ${id}.`);
      return null;
    }
  }

  async createItemInContainer(contentId, containerId, name, type, wrappedKey) {
    const resp = await this.callApi(
      `containers/${containerId}`,
      {
        uploadId: contentId,
        name,
        type, // this is 'FILE' or 'MESSAGE'
        wrappedKey,
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

  async deleteItem(itemId, containerId, shouldDeleteContent) {
    const resp = await this.callApi(
      `containers/${containerId}/item/${itemId}`,
      {
        shouldDeleteContent,
      },
      'DELETE'
    );
    if (resp) {
      return resp;
    } else {
      console.log(`Error: Unable to delete Item.`);
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

  async getContainerInfo(containerId) {
    const resp = await this.callApi(`containers/${containerId}/info`);
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not get container ${containerId}`);
      return null;
    }
  }

  async createConversation(ownerId, name) {
    // TODO: shift the userId from frontend argument to backend session
    const resp = await this.callApi(
      `containers`,
      {
        name: name ?? 'convo_' + timestamp(),
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

  async createFolder(ownerId, name) {
    // TODO: shift the userId from frontend argument to backend session
    const resp = await this.callApi(
      `containers`,
      {
        name: name ?? timestamp(),
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

  async getContainerGroupMembers(containerId) {
    const resp = await this.callApi(
      `containers/${containerId}/members`,
      {},
      'GET'
    );
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not list members for container ${containerId}`);
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
        `Error: could not add user ${userId} to container ${containerId}`
      );
      return null;
    }
  }

  async removeMemberFromContainer(userId, containerId) {
    const resp = await this.callApi(
      `containers/${containerId}/member/${userId}`,
      {},
      'DELETE'
    );
    if (resp) {
      return resp;
    } else {
      console.log(
        `Error: could not remove user ${userId} from container ${containerId}`
      );
      return null;
    }
  }

  async inviteGroupMember(containerId, wrappedKey, userId, senderId) {
    const resp = await this.callApi(
      `containers/${containerId}/member/sharekey`,
      {
        containerId,
        wrappedKey,
        userId,
        senderId,
      },
      'POST'
    );
    if (resp) {
      return resp;
    } else {
      console.log(
        `Error: could not share key with ${userId} for container ${containerId}`
      );
      return null;
    }
  }

  async getInvitations(userId) {
    // TODO: shift the userId from frontend argument to backend session
    const resp = await this.callApi(`users/${userId}/invitations/`);
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not get conversations for user ${userId}`);
      return null;
    }
  }

  async acceptInvitation(invitationId, containerId) {
    const resp = await this.callApi(
      `containers/${containerId}/member/accept/${invitationId}`,
      {},
      'POST'
    );
    if (resp) {
      return resp;
    } else {
      console.log(
        `Error: could not accept invitation ${invitationId} for container ${containerId}`
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

  async getFoldersSharedWithUser(userId) {
    // TODO: shift the userId from frontend argument to backend session
    const resp = await this.callApi(`users/${userId}/folders/sharedWithMe`);
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not get folders shared with user ${userId}`);
      return null;
    }
  }

  async getFoldersSharedByUser(userId) {
    // TODO: shift the userId from frontend argument to backend session
    const resp = await this.callApi(`users/${userId}/folders/sharedByMe`);
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not get folders shared by user ${userId}`);
      return null;
    }
  }

  async getUserPublicKey(userId) {
    console.log(`getting user public key`);
    const resp = await this.callApi(`users/${userId}/`);
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not get public key for user ${userId}`);
      return null;
    }
  }

  async createUser(email, publicKey, isEphemeral = false) {
    const resp = await this.callApi(
      `users`,
      {
        email,
        publicKey,
        tier: isEphemeral ? 'EPHEMERAL' : 'PRO',
      },
      'POST'
    );
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not create user`);
      return null;
    }
  }

  async login(email) {
    const resp = await this.callApi(`users/login`, { email }, 'POST');
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not log user in`);
      return null;
    }
  }

  async createEphemeralLink(
    containerId,
    wrappedKey,
    salt,
    challengeKey,
    challengeSalt,
    senderId,
    challengePlaintext,
    challengeCiphertext
  ) {
    const resp = await this.callApi(
      `ephemeral`,
      {
        containerId,
        wrappedKey,
        salt,
        challengeKey,
        challengeSalt,
        senderId,
        challengePlaintext,
        challengeCiphertext,
      },
      'POST'
    );
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not create ephemeral link`);
      return null;
    }
  }

  async getEphemeralLinkChallenge(hash) {
    const resp = await this.callApi(`ephemeral/${hash}/challenge`);
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not get ephemeral challenge data`);
      return null;
    }
  }

  async acceptEphemeralLink(hash, challengePlaintext) {
    const resp = await this.callApi(
      `ephemeral/${hash}/challenge`,
      {
        challengePlaintext,
      },
      'POST'
    );
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not get ephemeral challenge data`);
      return null;
    }
  }

  async burnAfterReading(containerId) {
    const resp = await this.callApi(
      `ephemeral/burn`,
      {
        containerId,
      },
      'POST'
    );
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not burn ephemeral conversation`);
      return null;
    }
  }

  async deleteContainer(containerId) {
    const resp = await this.callApi(`containers/${containerId}`, {}, 'DELETE');
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not delete container`);
      return null;
    }
  }

  // getEventSource(id) {
  //   // Future improvement: use "@microsoft/fetch-event-source"
  //   // which lets you POST.
  //   // We could use that for storing last seen message id on server.
  //   // This would enable "see new messages" like Discourse forum
  //   try {
  //     debugger;
  //     const eventSource = new EventSource(
  //       `${this.serverUrl}/api/stream/register/${id}`
  //     );
  //     if (eventSource) {
  //       console.log(`returning eventSource object`);
  //       return eventSource;
  //     } else {
  //       console.log(`Error: could not burn ephemeral conversation`);
  //       return null;
  //     }
  //   } catch (e) {
  //     console.log(`could not establish connection to event source server`);
  //     console.log(e);
  //     return null;
  //   }
  // }

  // async sendHeartbeat(id) {
  //   const resp = await this.callApi(`stream/ping`, { id }, 'POST');
  //   if (resp) {
  //     return resp;
  //   } else {
  //     console.log(`Error: could not send heartbeat`);
  //     return null;
  //   }
  // }
}
