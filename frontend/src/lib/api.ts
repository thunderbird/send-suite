export type JsonResponse<T = { [key: string]: any }> = T | T[];

export type AsyncJsonResponse<T = { [key: string]: any }> = Promise<
  JsonResponse<T>
> | null;

export class ApiConnection {
  serverUrl: string;
  sessionId: string;
  authToken: string;

  constructor(serverUrl: string) {
    if (!serverUrl) {
      throw Error('No Server URL provided.');
    }
    // using new URL() trims off excess whitespace and trailing '/'
    const u = new URL(serverUrl);
    this.serverUrl = u.origin;

    const token = localStorage.getItem('token');
    if (token) {
      this.authToken = token;
    }
  }

  toString(): string {
    return this.serverUrl;
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  async removeAuthToken() {
    this.authToken = '';
  }

  async requestAuthToken(): Promise<void> {
    const response = await this.call<{ token: any }>('auth');
    console.log('got request auth token', response);
    if (response) {
      localStorage.setItem('token', response.token);
      this.authToken = response.token;
    }
  }

  /**
   * Makes a network call to the specified path.
   *
   * @template T - The expected shape of the response object. If not provided, defaults to any object shape.
   *
   * @param {string} path - The path of the API endpoint. (Should not include `/api/`.)
   * @param {Record<string, any>} body - Optional Request body to submit to the API.
   * @param {string} method - The HTTP Request method.
   * @param {Record<string, any>} headers - Optional Request headers to include.
   * @returns {AsyncJsonResponse<T>} Returns a Promise that resolves to the response data (or null).
   *
   */
  public async call<
    T = { [key: string]: any },
    O extends Options = { fullResponse: false },
  >(
    path: string,
    body: Record<string, any> = {},
    method: string = 'GET',
    headers: Record<string, any> = {},
    options?: O
  ): Promise<O extends { fullResponse: true } ? Response : T | null> {
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
      headers: {
        'content-type': 'application/json',
        ...headers,
        authorization: 'Bearer ' + this.authToken,
      },
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
      console.log(e);
      return null;
    }

    if (!resp.ok) {
      return null;
    }

    if (!!options?.fullResponse) {
      //@ts-ignore
      return resp;
    }

    return resp.json();
  }
}

type Options = {
  fullResponse?: boolean;
};
