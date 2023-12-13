import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import WebSocket from 'ws';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import sessionFileStore from 'session-file-store';
import passport from 'passport';
import refresh from 'passport-oauth2-refresh';
import strategy from './OpenIdConnectStrategy';

import morgan from 'morgan';

import users from './routes/users';
import containers from './routes/containers';
import uploads from './routes/uploads';
import download from './routes/download';
import ephemeral from './routes/ephemeral';
import tags from './routes/tags';
import fxa from './routes/fxa';
// import createStreamingRouter from './routes/streamingRouter';

import wsUploadHandler from './wsUploadHandler';
import wsMsgHandler from './wsMsgHandler';
import { uuidv4 } from './utils';

// TODO: look into moving this to src/types/index.d.ts (or more appropriate filename)
type User = {
  id: number;
  email: string;
  publicKey: string;
  tier: string;
  createdAt: Date;
  updatedAt: Date;
  activatedAt: Date;
};
declare module 'express-session' {
  interface SessionData {
    user: User;
  }
}

const PORT = 8080;
const HOST = '0.0.0.0';
const WS_UPLOAD_PATH = `/api/ws`;
const WS_MESSAGE_PATH = `/api/messagebus`;

let streamingClients = [];
// const { router: streamingRouter, broadcast: streamingBroadcast } = createStreamingRouter(streamingClients);
const wsUploadServer = new WebSocket.Server({ noServer: true });
const wsMessageServer = new WebSocket.Server({ noServer: true });
const app = express();

app.use(morgan('combined'));

app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.set('trust proxy', 1); // trust first proxy
const FileStore = sessionFileStore(session);
const fileStoreOptions = {};
const expressSession = session({
  secret: process.env.SESSION_SECRET ?? 'abc123xyz',
  resave: false,
  saveUninitialized: true,
  // cookie: { secure: false, sameSite: 'strict' },
  cookie: {},
  store: new FileStore(fileStoreOptions),
});

app.use(expressSession);
app.use(cookieParser());

passport.use('openidconnect', strategy);
refresh.use('openidconnect', strategy);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, next) => {
  console.log(`🐓🐓🐓 serializing user`);
  console.log(user);
  next(null, user);
});

passport.deserializeUser((user, next) => {
  console.log(`🦄🦄🦄 deserializing user`);
  console.log(user);
  next(null, user);
});

declare module 'express-session' {
  export interface SessionData {
    passport: { [key: string]: any };
    isAuthenticated: boolean;
  }
}

app.use((req, res, next) => {
  req.session.isAuthenticated =
    req.session.passport && req.session.passport.user;

  console.log(
    `🍬 added isAuthenticated to req.session: ${req.session.isAuthenticated}`
  );
  next();
});

// app.use(
//   (req, res: express.Response & { broadcast: (data: any) => void }, next) => {
//     // attach streamingBroadcast to all response objects
//     res.broadcast = streamingBroadcast;
//     next();
//   }
// );
app.get('/', (req, res) => {
  res.status(200).send('echo');
});
app.get('/echo', (req, res) => {
  res.status(200).send('echo');
});

app.use('/api/users', users);
app.use('/api/containers', containers);
app.use('/api/uploads', uploads);
app.use('/api/download', download);
app.use('/api/ephemeral', ephemeral);
app.use('/api/tags', tags);
app.use('/lockbox/fxa', fxa);
// app.use('/api/stream', streamingRouter);

// Can't do this yet, no refreshToken
// app.get('/lockbox/profile', async (req, res) => {
//   refresh.requestNewAccessToken(
//     'openidconnect',
//     'some_refresh_token',
//     function (err, accessToken, refreshToken) {
//       // You have a new access token, store it in the user object,
//       // or use it to make a new request.
//       // `refreshToken` may or may not exist, depending on the strategy you are using.
//       // You probably don't need it anyway, as according to the OAuth 2.0 spec,
//       // it should be the same as the initial refresh token.
//     },
//   );
// })

app.get(`*`, (req, res) => {
  res.status(404);
});

const server = app.listen(PORT, HOST, async () => {
  // TODO: consider using `openid-client` for discovery.
  // Then, populate a global config object.
  console.log(`🚀 Server ready at: http://${HOST}:${PORT}`);
});

const messageClients = new Map();
// Listen for WebSocket connections
server.on('upgrade', (req, socket, head) => {
  console.log('got the upgrade request');
  if (req.url === WS_UPLOAD_PATH) {
    console.log(`upgrading ${WS_UPLOAD_PATH}`);
    wsUploadServer.handleUpgrade(req, socket, head, (ws) => {
      console.log('handling upgrade for upload');
      wsUploadServer.emit('connection', ws, req);
      wsUploadHandler(ws, req);
    });
  } else if (req.url.startsWith(WS_MESSAGE_PATH)) {
    console.log(`upgrading ${WS_MESSAGE_PATH}`);
    wsMessageServer.handleUpgrade(req, socket, head, (ws) => {
      console.log('handling upgrade for messages');
      // wsMessageServer.emit('connection', ws, req);
      // const id = uuidv4();
      const parts = req.url.split('/');
      const id = parts[parts.length - 1];
      console.log(id);
      messageClients.set(id, ws);
      wsMsgHandler(ws, messageClients);
    });
  }
});
