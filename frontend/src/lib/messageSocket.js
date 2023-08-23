import { connectToWebSocketServer } from './utils';

export async function createMessageSocket(id) {
  const endpoint = `wss://localhost:8088/api/messagebus/${id}`;
  const connection = await connectToWebSocketServer(endpoint);

  connection.onclose = function (e) {
    console.log(
      'Socket is closed. Reconnect will be attempted in 1 second.',
      e.reason
    );
    setTimeout(function () {
      connect();
    }, 1000);
  };

  connection.onerror = function (err) {
    console.error('Socket encountered error: ', err.message, 'Closing socket');
    connection.close();
  };

  return connection;
}
