import { SEND_SERVER, serverUrl, ITEM_TYPES } from "./const";
import { arrayToB64, b64ToArray, delay } from "./utils";
import { ECE_RECORD_SIZE } from "./ece";

// =============================================================================
// API wrapper
export class ApiConnection {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
  }

  toString() {
    return this.serverUrl;
  }

  async callApi(path, body, method) {
    const url = `${this.serverUrl}/api/${path}`;
    const opts = {
      mode: "cors",
      method,
      headers: { "content-type": "application/json" },
    };

    if (method.trim().toUpperCase() === "POST") {
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

  async createNewUser(email) {
    const resp = await this.callApi("users/", { email }, "POST");
    if (resp) {
      const { user } = resp;
      console.log(user);
      return user;
    } else {
      console.log(`unable to create user`);
      return null;
    }
  }

  async login(email) {
    return await this.callApi("users/login", { email }, "POST");
  }

  async userExists(email) {
    return await this.callApi("users/exist", { email }, "POST");
  }

  // =============================================================================
  // Read helpers
  async getMessages(userId) {
    const messages = await this.callApi(
      `users/${userId}/items?type=${ITEM_TYPES.MESSAGE}`,
      null,
      "GET"
    );
    console.log(`returned by getMessages:`);
    console.log(messages);
    return messages;
  }

  // =============================================================================
  // Share helpers

  async createItem(url, sharedBy, asFile) {
    const itemType = asFile ? "FILE" : "MESSAGE";
    const resp = await this.callApi(
      `items?type=${itemType}`,
      {
        url,
        sharedBy,
      },
      "POST"
    );
    if (resp) {
      const { item } = resp;
      console.log(item);
      return item;
    } else {
      console.log(
        "❌ Unable add create item in database",
        `Error: Unable to create db item for message.`
      );
      return null;
    }
  }

  async shareToGroup(itemId, groupId) {
    const resp = await this.callApi(
      `groups/${groupId}/items`,
      {
        itemId,
      },
      "POST"
    );
    console.log(`sharing ${itemId} to group ${groupId}`);
    console.log(resp);
    return resp ?? null;
  }

  async shareWith(itemId, fromEmail, recipientEmails) {
    const emailAddresses = [fromEmail, ...recipientEmails];

    // POST `emailAddresses` in order to find existing group, or create new
    const resp = await this.callApi(
      `groups`,
      {
        emailAddresses,
      },
      "POST"
    );
    if (resp) {
      const { group } = resp;
      console.log(group);
      return await this.shareToGroup(itemId, group.id);
    } else {
      return null;
    }
  }
}

// =============================================================================
// Upload, download, and decryption helpers

class ConnectionError extends Error {
  constructor(cancelled, duration, size) {
    super(cancelled ? "0" : "connection closed");
    this.cancelled = cancelled;
    this.duration = duration;
    this.size = size;
  }
}

export class FileManager {
  // Expects to receive an instance of ApiConnection
  constructor(api) {
    if (api.value) {
      alert(`Wrapped Vue ref passed instead of plain instance`);
    }
    this.api = api;
    this.server_info = new URL(this.api.serverUrl);
  }

  async upload(
    stream,
    metadata,
    verifierB64,
    timeLimit,
    dlimit,
    bearerToken,
    onprogress,
    canceller
  ) {
    let size = 0;
    const start = Date.now();
    const host = this.server_info.hostname;
    const port = this.server_info.port;
    const protocol = this.server_info.protocol === "https:" ? "wss:" : "ws:";
    const endpoint = `${protocol}//${host}${port ? ":" : ""}${port}/filemgr/ws`;

    const ws = await asyncInitWebSocket(endpoint);

    try {
      const metadataHeader = arrayToB64(new Uint8Array(metadata));
      const fileMeta = {
        fileMetadata: metadataHeader,
        authorization: `send-v1 ${verifierB64}`,
        bearer: bearerToken,
        timeLimit,
        dlimit,
      };

      const uploadInfoResponse = listenForResponse(ws, canceller);
      ws.send(JSON.stringify(fileMeta));
      const uploadInfo = await uploadInfoResponse;
      console.log(
        `👍👍👍 we did the uploadInfo, which was ${
          JSON.stringify(fileMeta).length
        } chars long`
      );
      console.log(uploadInfo);
      const completedResponse = listenForResponse(ws, canceller);

      const reader = stream.getReader();
      let state = await reader.read();
      while (!state.done) {
        if (canceller.cancelled) {
          ws.close();
        }
        if (ws.readyState !== WebSocket.OPEN) {
          break;
        }
        const buf = state.value;
        ws.send(buf);
        onprogress(size);
        size += buf.length;
        state = await reader.read();
        while (
          ws.bufferedAmount > ECE_RECORD_SIZE * 2 &&
          ws.readyState === WebSocket.OPEN &&
          !canceller.cancelled
        ) {
          await delay();
        }
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(new Uint8Array([0])); //EOF
      }

      await completedResponse;
      console.log(`👍👍👍 and...this is the completedResponse?`);
      console.log(completedResponse);
      uploadInfo.duration = Date.now() - start;
      return uploadInfo;
    } catch (e) {
      e.size = size;
      e.duration = Date.now() - start;
      throw e;
    } finally {
      if (![WebSocket.CLOSED, WebSocket.CLOSING].includes(ws.readyState)) {
        ws.close();
      }
    }
  }

  // Calls upload()
  // Returns a cancel() function and the result of upload()
  async uploadWs(
    encrypted,
    metadata,
    verifierB64,
    timeLimit,
    dlimit,
    bearerToken,
    onprogress
  ) {
    const canceller = { cancelled: false };

    return {
      cancel: function () {
        canceller.cancelled = true;
      },

      result: await this.upload(
        encrypted,
        metadata,
        verifierB64,
        timeLimit,
        dlimit,
        bearerToken,
        onprogress,
        canceller
      ),
    };
  }

  getDownloadUrl(id) {
    return `${this.api.serverUrl}/filemgr/download/${id}`;
  }

  getBlobUrl(id) {
    return `${this.api.serverUrl}/filemgr/download/blob/${id}`;
  }

  async metadata(id, keychain) {
    console.log(`api.js metadata()`);
    const result = await fetchWithAuthAndRetry(
      `${this.api.serverUrl}/filemgr/metadata/${id}`,
      { method: "GET" },
      keychain
    );
    if (result.ok) {
      const data = await result.response.json();
      const meta = await keychain.decryptMetadata(b64ToArray(data.metadata));
      return {
        size: meta.size,
        ttl: data.ttl,
        iv: meta.iv,
        name: meta.name,
        type: meta.type,
        manifest: meta.manifest,
      };
    }
    throw new Error(result.response.status);
  }

  async download(id, keychain, onprogress, canceller) {
    const auth = await keychain.authHeader();
    const xhr = new XMLHttpRequest();
    canceller.oncancel = function () {
      xhr.abort();
    };
    const that = this; // coding JS like it's 2007
    return new Promise(function (resolve, reject) {
      xhr.addEventListener("loadend", function () {
        canceller.oncancel = function () {};
        const authHeader = xhr.getResponseHeader("WWW-Authenticate");
        if (authHeader) {
          keychain.nonce = parseNonce(authHeader);
        }
        if (xhr.status !== 200) {
          return reject(new Error(xhr.status));
        }

        const blob = new Blob([xhr.response]);
        resolve(blob);
      });

      xhr.addEventListener("progress", function (event) {
        if (event.target.status === 200) {
          onprogress(event.loaded);
        }
      });
      xhr.open("get", that.getBlobUrl(id));
      xhr.setRequestHeader("Authorization", auth);
      xhr.responseType = "blob";
      xhr.send();
      onprogress(0);
    });
  }

  async tryDownload(id, keychain, onprogress, canceller, tries = 2) {
    try {
      const result = await this.download(id, keychain, onprogress, canceller);
      console.log(`👿 no?`);
      return result;
    } catch (e) {
      if (e.message === "401" && --tries > 0) {
        return this.tryDownload(id, keychain, onprogress, canceller, tries);
      }
      throw e;
    }
  }

  downloadFile(id, keychain, onprogress) {
    const canceller = {
      oncancel: function () {}, // download() sets this
    };
    function cancel() {
      canceller.oncancel();
    }
    return {
      cancel,
      result: this.tryDownload(id, keychain, onprogress, canceller),
    };
  }
}

export function getApiUrl(path) {
  debugger;
  // need to get rid of references to serverUrl
  return serverUrl + path;
}

function post(obj, bearerToken) {
  const h = {
    "Content-Type": "application/json",
  };
  if (bearerToken) {
    h["Authentication"] = `Bearer ${bearerToken}`;
  }
  return {
    method: "POST",
    headers: new Headers(h),
    body: JSON.stringify(obj),
  };
}

export async function del(id, owner_token) {
  const response = await fetch(
    getApiUrl(`/filemgr/delete/${id}`),
    post({ owner_token })
  );
  return response.ok;
}

export async function setParams(id, owner_token, bearerToken, params) {
  const response = await fetch(
    getApiUrl(`/filemgr/params/${id}`),
    post(
      {
        owner_token,
        dlimit: params.dlimit,
      },
      bearerToken
    )
  );
  return response.ok;
}

export async function fileInfo(id, owner_token) {
  const response = await fetch(
    getApiUrl(`/filemgr/info/${id}`),
    post({ owner_token })
  );

  if (response.ok) {
    const obj = await response.json();
    return obj;
  }

  throw new Error(response.status);
}

export async function setPassword(id, owner_token, keychain) {
  const auth = await keychain.authKeyB64();
  const response = await fetch(
    getApiUrl(`/filemgr/password/${id}`),
    post({ owner_token, auth })
  );
  return response.ok;
}

////////////////////////

async function downloadS(id, keychain, signal) {
  debugger;
  const auth = await keychain.authHeader();
  console.log(`🧨 api.downloadS(): accessing filemgr/download/:id`);
  const response = await fetch(getApiUrl(`/filemgr/download/${id}`), {
    signal: signal,
    method: "GET",
    headers: { Authorization: auth },
  });

  const authHeader = response.headers.get("WWW-Authenticate");
  if (authHeader) {
    keychain.nonce = parseNonce(authHeader);
  }

  if (response.status !== 200) {
    throw new Error(response.status);
  }

  return response.body;
}

async function tryDownloadStream(id, keychain, signal, tries = 2) {
  try {
    const result = await downloadS(id, keychain, signal);
    return result;
  } catch (e) {
    if (e.message === "401" && --tries > 0) {
      return tryDownloadStream(id, keychain, signal, tries);
    }
    if (e.name === "AbortError") {
      throw new Error("0");
    }
    throw e;
  }
}

export function downloadStream(id, keychain) {
  const controller = new AbortController();
  function cancel() {
    controller.abort();
  }
  return {
    cancel,
    result: tryDownloadStream(id, keychain, controller.signal),
  };
}

//////////////////

//////////////////////////////////////////////////////////////////////////
// ok to hoist

function asyncInitWebSocket(server) {
  console.log(`opening websocket connection`);
  return new Promise((resolve, reject) => {
    try {
      const ws = new WebSocket(server);
      ws.addEventListener("open", () => resolve(ws), { once: true });
    } catch (e) {
      reject(new ConnectionError(false));
    }
  });
}

function listenForResponse(ws, canceller) {
  return new Promise((resolve, reject) => {
    function handleClose(event) {
      // a 'close' event before a 'message' event means the request failed
      ws.removeEventListener("message", handleMessage);
      reject(new ConnectionError(canceller.cancelled));
    }
    function handleMessage(msg) {
      ws.removeEventListener("close", handleClose);
      try {
        const response = JSON.parse(msg.data);
        if (response.error) {
          throw new Error(response.error);
        } else {
          resolve(response);
        }
      } catch (e) {
        reject(e);
      }
    }
    ws.addEventListener("message", handleMessage, { once: true });
    ws.addEventListener("close", handleClose, { once: true });
  });
}

function parseNonce(header) {
  header = header || "";
  return header.split(" ")[1];
}

async function fetchWithAuth(url, params, keychain) {
  console.log(`fetchWithAuth()`);
  const result = {};
  params = params || {};
  const h = await keychain.authHeader();
  params.headers = new Headers({
    Authorization: h,
    "Content-Type": "application/json",
  });
  const response = await fetch(url, params);
  result.response = response;
  result.ok = response.ok;

  const nonce = parseNonce(response.headers.get("WWW-Authenticate"));
  result.shouldRetry = response.status === 401 && nonce !== keychain.nonce;
  keychain.nonce = nonce;
  return result;
}

async function fetchWithAuthAndRetry(url, params, keychain) {
  console.log(`fetchWithAuthAndRetry()`);
  const result = await fetchWithAuth(url, params, keychain);
  if (result.shouldRetry) {
    return fetchWithAuth(url, params, keychain);
  }
  return result;
}
