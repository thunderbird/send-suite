import { connectToWebSocketServer } from './utils';

export async function createMessageSocket(endpoint) {
  const connection = await connectToWebSocketServer(endpoint);

  connection.onclose = function (e) {
    console.log(
      'Socket is closed. Reconnect will be attempted in 1 second.',
      e.reason
    );
    setTimeout(function () {
      createMessageSocket(endpoint);
    }, 1000);
  };

  connection.onerror = function (err) {
    console.error('Socket encountered error: ', err.message, 'Closing socket');
    connection.close();
  };

  return connection;
}
