export class ApiConnection {
  serverUrl: string;
  sessionId: string;

  constructor(serverUrl: string) {
    if (!serverUrl) {
      throw Error('No Server URL provided.');
    }
    // using new URL() trims off excess whitespace and trailing '/'
    const u = new URL(serverUrl);
    this.serverUrl = u.origin;
  }

  toString(): string {
    return this.serverUrl;
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  public async call<T = { [key: string]: any }>(
    path: string,
    body = {},
    method = 'GET',
    headers = {}
  ): Promise<T | null> {
    if (this.sessionId) {
      headers = {
        ...headers,
        sessionId: this.sessionId,
      };
    }

    const url = `${this.serverUrl}/api/${path}`;
    const opts: Record<string, any> = {
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

    let resp: Response;
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
