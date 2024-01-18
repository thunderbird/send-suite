import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import WebSocket from 'ws';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import sessionFileStore from 'session-file-store';

import morgan from 'morgan';

import users from './routes/users';
import containers from './routes/containers';
import uploads from './routes/uploads';
import download from './routes/download';
import ephemeral from './routes/ephemeral';
import tags from './routes/tags';
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

app.use(express.json({ limit: '5mb' }));
// app.use(
//   cors({
//     origin: 'moz-extension://19f948ec-3c58-4af6-9ec8-f2d1d5d01044',
//     credentials: true,
//   })
// );

let allowedOrigins = ['http://localhost:5173'];

app.use((req, res, next) => {
  let origin = req.headers.origin;

  // Check if it's a Thunderbird extension origin
  if (origin && origin.startsWith('moz-extension://')) {
    allowedOrigins.push(origin);
  }

  // Allow any matching origin
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS'));
      }
    },
    credentials: true,
  })(req, res, next);
});

app.set('trust proxy', 1); // trust first proxy
const FileStore = sessionFileStore(session);
const fileStoreOptions = {};
const expressSession = session({
  secret: process.env.SESSION_SECRET ?? 'abc123xyz',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, sameSite: 'strict' },
  store: new FileStore(fileStoreOptions),
});
app.use(expressSession);
app.use(cookieParser());

// app.use((req, res, next) => {
//   res.header('Access-Control-Expose-Headers', 'WWW-Authenticate');
//   next();
// });

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

app.use('/api/users', users);
app.use('/api/containers', containers);
app.use('/api/uploads', uploads);
app.use('/api/download', download);
app.use('/api/ephemeral', ephemeral);
app.use('/api/tags', tags);
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
  // console.log('got the upgrade request');
  if (req.url === WS_UPLOAD_PATH) {
    // console.log(`upgrading ${WS_UPLOAD_PATH}`);
    wsUploadServer.handleUpgrade(req, socket, head, (ws) => {
      // console.log('handling upgrade for upload');
      wsUploadServer.emit('connection', ws, req);
      wsUploadHandler(ws, req);
    });
  } else if (req.url.startsWith(WS_MESSAGE_PATH)) {
    console.log(`upgrading ${WS_MESSAGE_PATH}`);
    wsMessageServer.handleUpgrade(req, socket, head, (ws) => {
      // console.log('handling upgrade for messages');
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
