import { EventEmitter } from 'ws';

export const loginEmitter = new EventEmitter();

loginEmitter.on('login_complete', () =>
  console.log('Login complete event received')
);
loginEmitter.on('login_attempt', () =>
  console.log('Login attempt event received')
);
loginEmitter.on('login_url_requested', () =>
  console.log('Login url requested')
);
