import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import WebSocket from 'ws';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import sessionFileStore from 'session-file-store';
import passport from 'passport';
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

passport.use(strategy);
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

app.get(`*`, (req, res) => {
  res.status(404);
});

const server = app.listen(PORT, HOST, () =>
  console.log(`🚀 Server ready at: http://${HOST}:${PORT}`)
);

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
