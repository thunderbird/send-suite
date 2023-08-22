import { connectToWebSocketServer } from './utils';

export async function createMessageSocket(id) {
  const endpoint = `wss://localhost:8088/api/messagebus/${id}`;
  const connection = await connectToWebSocketServer(endpoint);

  return connection;
}
