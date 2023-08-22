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

  async removeMemberFromContainer(userId, containerId) {
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

  async createEphemeralLink(
    containerId,
    wrappedKey,
    senderId,
    salt,
    challengePlaintext,
    challengeCiphertext
  ) {
    const resp = await this.callApi(
      `ephemeral`,
      {
        containerId,
        wrappedKey,
        senderId,
        salt,
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
