import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import WebSocket from 'ws';

import users from './routes/users';
import containers from './routes/containers';
import uploads from './routes/uploads';
import download from './routes/download';
import ephemeral from './routes/ephemeral';

import wsHandler from './wsHandler';

const PORT = 8080;
const HOST = '0.0.0.0';
const WS_PATH = `/api/ws`;

const wsServer = new WebSocket.Server({ noServer: true });
const app = express();

app.use(express.json());
app.use(cors());
// app.use((req, res, next) => {
//   res.header('Access-Control-Expose-Headers', 'WWW-Authenticate');
//   next();
// });

app.get('/', (req, res) => {
  res.status(200).send('echo');
});

app.use('/api/users', users);
app.use('/api/containers', containers);
app.use('/api/uploads', uploads);
app.use('/api/download', download);
app.use('/api/ephemeral', ephemeral);

app.get(`*`, (req, res) => {
  res.status(404);
});

const server = app.listen(PORT, HOST, () =>
  console.log(`🚀 Server ready at: http://${HOST}:${PORT}`)
);

// Listen for WebSocket connections
server.on('upgrade', (req, socket, head) => {
  console.log('got the upgrade request');
  if (req.url === WS_PATH) {
    console.log(`upgrading ${WS_PATH}`);
    wsServer.handleUpgrade(req, socket, head, (ws) => {
      console.log('handling upgrade');
      wsServer.emit('connection', ws, req);
      wsHandler(ws, req);
    });
  }
});
