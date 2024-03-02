import { timestamp } from './utils';
import { CONTAINER_TYPE, ITEM_TYPE } from './const';

export class ApiConnection {
  constructor(serverUrl) {
    // using new URL() trims off excess whitespace and trailing '/'
    console.log(`ApiConnection got passed the following serverUrl: ${serverUrl}`);
    if (!serverUrl) {
      throw Error('No Server URL provided.');
    }
    const u = new URL(serverUrl);
    this.serverUrl = u.origin;
  }

  toString() {
    return this.serverUrl;
  }

  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }

  async callApi(path, body = {}, method = 'GET', headers = {}) {
    if (this.sessionId) {
      headers = {
        ...headers,
        sessionId: this.sessionId,
      };
    }

    const url = `${this.serverUrl}/api/${path}`;
    const opts = {
      mode: 'cors',
      credentials: 'include', // include cookies
      method,
      headers: { 'content-type': 'application/json', ...headers },
    };

    if (method.trim().toUpperCase() === 'POST') {
      opts.body = JSON.stringify({
        ...body,
      });
    }

    let resp;
    try {
      resp = await fetch(url, opts);
    } catch (e) {
      // debugger;
      console.log(e);
      return null;
    }

    if (!resp.ok) {
      return null;
    }
    return resp.json();
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

  async getContainerGroupMembers(containerId) {
    const resp = await this.callApi(`containers/${containerId}/members`, {}, 'GET');
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
      console.log(`Error: could not add user ${userId} to container ${containerId}`);
      return null;
    }
  }

  async removeInvitationAndGroupMembership(containerId, invitationId) {
    const resp = await this.callApi(`containers/${containerId}/member/remove/${invitationId}`, {}, 'DELETE');
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not remove invitation ${invitationId} from container ${containerId}`);
      return null;
    }
  }

  async inviteGroupMember(containerId, wrappedKey, recipientId, senderId) {
    const resp = await this.callApi(
      `containers/${containerId}/member/invite`,
      {
        wrappedKey,
        recipientId,
        senderId,
      },
      'POST'
    );
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not share key with ${userId} for container ${containerId}`);
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
    const resp = await this.callApi(`containers/${containerId}/member/accept/${invitationId}`, {}, 'POST');
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not accept invitation ${invitationId} for container ${containerId}`);
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

  async getUserFolders(userId) {
    // TODO: shift the userId from frontend argument to backend session
    const resp = await this.callApi(`users/${userId}/folders/`);
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not get folders for user ${userId}`);
      return null;
    }
  }

  async getRecentActivity(userId) {
    // TODO: shift the userId from frontend argument to backend session
    const resp = await this.callApi(`users/${userId}/activity/`);
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not get folders for user ${userId}`);
      return null;
    }
  }

  async getSharesForFolder(containerId, userId) {
    // TODO: shift the userId from frontend argument to backend session
    const resp = await this.callApi(`containers/${containerId}/shares`, {
      userId,
    });
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not get sharing info for ${containerId}`);
      return null;
    }
  }

  async getFoldersSharedWithUser(userId) {
    // TODO: shift the userId from frontend argument to backend session
    console.log(`🐓🐓🐓🐓🐓🐓🐓calling users/${userId}/folders/sharedWithMe`);
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

  async updateInvitationPermissions(containerId, userId, invitationId, permission) {
    const resp = await this.callApi(
      `containers/${containerId}/shares/invitation/update`,
      { userId, invitationId, permission },
      'POST'
    );
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not update permissions for invitation ${invitationId}`);
      return null;
    }
  }
  async updateAccessLinkPermissions(containerId, userId, accessLinkId, permission) {
    const resp = await this.callApi(
      `containers/${containerId}/shares/accessLink/update`,
      { userId, accessLinkId, permission },
      'POST'
    );
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not update permissions for accessLink ${accessLinkId}`);
      return null;
    }
  }

  async getUserByEmail(email) {
    console.log(`getting user public key`);
    const resp = await this.callApi(`users/lookup/${email}/`);
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not get user ${email}`);
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

  async burnAfterReading(containerId) {
    const resp = await this.callApi(
      `sharing/burn`,
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

  async addTagForContainer(containerId, name, color) {
    const resp = await this.callApi(
      `tags/container/${containerId}`,
      {
        name,
        color,
      },
      'POST'
    );
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not add tag`);
      return null;
    }
  }
  async addTagForItem(itemId, name, color) {
    const resp = await this.callApi(
      `tags/item/${itemId}`,
      {
        name,
        color,
      },
      'POST'
    );
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not add tag`);
      return null;
    }
  }

  async createBackup(userId, keys, keypair, keystring, salt) {
    const resp = await this.callApi(
      `users/${userId}/backup`,
      {
        keys,
        keypair,
        keystring,
        salt,
      },
      'POST'
    );
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not create backup`);
      return null;
    }
  }

  async getBackup(userId) {
    const resp = await this.callApi(`users/${userId}/backup`);
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not retrieve backup`);
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
