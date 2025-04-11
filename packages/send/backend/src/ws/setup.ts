// Configure sentry
import { TRPC_WS_PATH } from '@/config';
import '../sentry';

import { logger } from '@/utils/logger';
import 'dotenv/config';
import { wsMessageServer, wss, wsUploadServer } from '../index';
import wsMsgHandler from '../wsMsgHandler';
import wsUploadHandler from '../wsUploadHandler';

const WS_UPLOAD_PATH = `/api/ws`;
const WS_MESSAGE_PATH = `/api/messagebus`;

const messageClients = new Map();

export const wsHandler = (server) => {
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
    } else if (req.url === TRPC_WS_PATH) {
      logger.log(`✅ WebSocket Server listening on ${TRPC_WS_PATH}`);
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
        wss.on('connection', (ws) => {
          logger.log(`➕➕ Connection (${wss.clients.size})`);
          ws.once('close', () => {
            logger.log(`➖➖ Connection (${wss.clients.size})`);
          });
        });
      });
    }
  });
};
