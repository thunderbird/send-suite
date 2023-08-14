// create user with public key
//
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
      console.log(`Error: Unable to create db item for message.`);
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
}
