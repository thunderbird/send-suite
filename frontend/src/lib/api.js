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
}
