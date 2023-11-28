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

  async createFolder(ownerId, name, parentId = 0, shareOnly = false) {
    // TODO: shift the userId from frontend argument to backend session
    const resp = await this.callApi(
      `containers`,
      {
        name: name ?? timestamp(),
        ownerId,
        type: CONTAINER_TYPE.FOLDER,
        parentId,
        shareOnly,
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

  async createInvitationForAccessLink(linkId, recipientId) {
    const resp = await this.callApi(`ephemeral/${linkId}/member/${recipientId}/accept`, {}, 'POST');
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not create invitation for accessLink ${linkId} for recipient ${recipientId}`);
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

  async getFolderTree(userId, rootFolderId) {
    // TODO: shift the userId from frontend argument to backend session
    const resp = await this.callApi(`containers/${rootFolderId}/`);
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

  async renameFolder(containerId, name) {
    const resp = await this.callApi(`containers/${containerId}/rename`, { name }, 'POST');
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not update name for container ${containerId}`);
      return null;
    }
  }

  async renameItem(containerId, itemId, name) {
    const resp = await this.callApi(`containers/${containerId}/item/${itemId}/rename`, { name }, 'POST');
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not update name for item ${itemId}`);
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

  async createAccessLink(
    containerId,
    wrappedKey,
    salt,
    challengeKey,
    challengeSalt,
    senderId,
    challengePlaintext,
    challengeCiphertext,
    expiration
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
        expiration,
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

  async isAccessLinkValid(linkId) {
    const resp = await this.callApi(`ephemeral/exists/${linkId}`);
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not query access link`);
      return null;
    }
  }
  async deleteAccessLink(linkId) {
    const resp = await this.callApi(`ephemeral/${linkId}`, {}, 'DELETE');
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not delete accessLink`);
      return null;
    }
  }

  async getEphemeralLinkChallenge(linkId) {
    const resp = await this.callApi(`ephemeral/${linkId}/challenge`);
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not get ephemeral challenge data`);
      return null;
    }
  }

  async acceptEphemeralLink(linkId, challengePlaintext) {
    const resp = await this.callApi(
      `ephemeral/${linkId}/challenge`,
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

  async getContainerWithItemsForAccessLink(linkId) {
    const resp = await this.callApi(`ephemeral/${linkId}/`);
    if (resp) {
      return resp;
    } else {
      console.log(`Error: could not get container for share ${linkId}`);
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
