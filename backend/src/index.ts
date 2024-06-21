import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import sessionFileStore from 'session-file-store';
import WebSocket from 'ws';

import containers from './routes/containers';
import download from './routes/download';
import fxa from './routes/fxa';
import sharing from './routes/sharing';
import tags from './routes/tags';
import uploads from './routes/uploads';
import users from './routes/users';

import wsMsgHandler from './wsMsgHandler';
import wsUploadHandler from './wsUploadHandler';

import { errorHandler } from './errors/routes';
import logger from './logger';
import loggerRoute from './routes/logger';

type Profile = {
  mozid: string;
  avatar: string;
  userId: number;
  accessToken: string;
  refreshToken: string;
};
type User = {
  id: number;
  email: string;
  tier: string;
  createdAt: Date;
  updatedAt: Date;
  activatedAt: Date;
  profile?: Profile;
};
declare module 'express-session' {
  interface SessionData {
    user: User;
    isAuthenticated: boolean;
  }
}

const PORT = 8080;
const HOST = '0.0.0.0';
const WS_UPLOAD_PATH = `/api/ws`;
const WS_MESSAGE_PATH = `/api/messagebus`;

const wsUploadServer = new WebSocket.Server({ noServer: true });
const wsMessageServer = new WebSocket.Server({ noServer: true });

const app = express();
app.use(express.static('public'));
app.use(express.json({ limit: '5mb' }));

const allowedOrigins = ['http://localhost:5173'];

app.use((req, res, next) => {
  const origin = req.headers.origin;

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
  cookie: {
    secure: process.env.APP_ENV === 'production',
    sameSite: 'none', // Cannot use 'lax' or 'strict' for local dev.
  },
  store: new FileStore(fileStoreOptions),
});

app.use(expressSession);
app.use(cookieParser());

app.get('/', (req, res) => {
  res.status(200).send('echo');
});

app.get('/api/debug-session', (req, res) => {
  res.status(200).json({
    session: req.session,
  });
});

app.use('/api/users', users);
app.use('/api/containers', containers);
app.use('/api/uploads', uploads);
app.use('/api/download', download);
app.use('/api/sharing', sharing);
app.use('/api/tags', tags);
app.use('/lockbox/fxa', fxa);
app.use('/api/lockbox/fxa', fxa);
app.use(loggerRoute);
app.get(`*`, (req, res) => {
  res.status(404);
});

// errorHandler needs to be final middleware registered.
app.use(errorHandler);

const server = app.listen(PORT, HOST, async () => {
  logger.info(`🚀 Server ready at: http://${HOST}:${PORT}`);
});

const messageClients = new Map();
// Listen for WebSocket connections
server.on('upgrade', (req, socket, head) => {
  if (req.url === WS_UPLOAD_PATH) {
    wsUploadServer.handleUpgrade(req, socket, head, (ws) => {
      wsUploadServer.emit('connection', ws, req);
      wsUploadHandler(ws, req);
    });
  } else if (req.url.startsWith(WS_MESSAGE_PATH)) {
    logger.info(`upgrading ${WS_MESSAGE_PATH}`);
    wsMessageServer.handleUpgrade(req, socket, head, (ws) => {
      const parts = req.url.split('/');
      const id = parts[parts.length - 1];
      logger.info(id);
      messageClients.set(id, ws);
      wsMsgHandler(ws, messageClients);
    });
  }
});
