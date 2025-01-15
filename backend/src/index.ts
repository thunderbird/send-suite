// Configure sentry
import * as trpcExpress from '@trpc/server/adapters/express';
import * as t from './trpc';

import './sentry';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import WebSocket from 'ws';

import { getAllowedOrigins } from './auth/client';

import auth from './routes/auth';
import containers from './routes/containers';
import download from './routes/download';
import fxa from './routes/fxa';
import sharing from './routes/sharing';
import tags from './routes/tags';
import uploads from './routes/uploads';
import users from './routes/users';

import wsMsgHandler from './wsMsgHandler';
import wsUploadHandler from './wsUploadHandler';

import * as Sentry from '@sentry/node';

import { getDataFromAuthenticatedRequest } from './auth/client';
import { errorHandler } from './errors/routes';
import metricsRoute from './routes/metrics';
import { containersRouter } from './trpc/containers';
import { sharingRouter } from './trpc/sharing';
import { usersRouter } from './trpc/users';

const PORT = 8080;
const HOST = '0.0.0.0';
const WS_UPLOAD_PATH = `/api/ws`;
const WS_MESSAGE_PATH = `/api/messagebus`;

const wsUploadServer = new WebSocket.Server({ noServer: true });
const wsMessageServer = new WebSocket.Server({ noServer: true });

const app = express();
app.use(express.static('public'));
app.use(express.json({ limit: '5mb' }));

const allowedOrigins = getAllowedOrigins();

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
app.use(cookieParser());

app.get('/', (_, res) => {
  res.status(200).send('echo');
});

app.get('/echo', (_, res) => {
  res.status(200).json({ message: 'API echo response' });
});

app.get('/error', (_, res) => {
  console.error('catching error on purpose');

  res.status(200).json({ message: 'API is simulating an error' });
});

app.get('/api/health', (_, res) => {
  res.status(200).json({
    session: 'API is alive',
  });
});

export const router = t.router;
export const publicProcedure = t.publicProcedure;
export const mergeRouters = t.mergeRouters;

/* tRPC */
// Create context for every trpc request
export const createContext = ({
  req,
}: trpcExpress.CreateExpressContextOptions) => {
  const { id, email, uniqueHash } = getDataFromAuthenticatedRequest(req);
  return {
    user: { id: id.toString(), email, uniqueHash },
  };
};
// Put together all our routers
const appRouter = mergeRouters(
  usersRouter,
  containersRouter,
  sharingRouter
  /* Add more routers here */
);

app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.use('/api/users', users);
app.use('/api/containers', containers);
app.use('/api/uploads', uploads);
app.use('/api/download', download);
app.use('/api/sharing', sharing);
app.use('/api/tags', tags);
app.use('/lockbox/fxa', fxa);
app.use('/fxa', fxa);
app.use('/api/lockbox/fxa', fxa);
app.use('/api/auth', auth);
app.use(metricsRoute);
app.use((_, res) => {
  res.status(404).send('404 Not Found');
});

// Add this after all routes,
// but before any and other error-handling middlewares are defined
Sentry.setupExpressErrorHandler(app);

// errorHandler needs to be final middleware registered.
app.use(errorHandler);

const server = app.listen(PORT, HOST, async () => {
  console.log(`🚀 Server ready at: http://${HOST}:${PORT}`);
});

const messageClients = new Map();
// Listen for WebSocket connections
server.on('upgrade', (req, socket, head) => {
  if (req.url === WS_UPLOAD_PATH) {
    wsUploadServer.handleUpgrade(req, socket, head, (ws) => {
      wsUploadServer.emit('connection', ws, req);
      wsUploadHandler(ws);
    });
  } else if (req.url.startsWith(WS_MESSAGE_PATH)) {
    console.info(`upgrading ${WS_MESSAGE_PATH}`);
    wsMessageServer.handleUpgrade(req, socket, head, (ws) => {
      const parts = req.url.split('/');
      const id = parts[parts.length - 1];
      console.info(id);
      messageClients.set(id, ws);
      wsMsgHandler(ws, messageClients);
    });
  }
});

export type AppRouter = typeof appRouter;
