import { connectToWebSocketServer } from './utils';

export async function createMessageSocket(
  endpoint: string
): Promise<WebSocket> {
  const connection = await connectToWebSocketServer(endpoint);

  connection.onclose = function (e) {
    // Uncomment this when you start debugging the disconnection issues.
    // console.log(
    //   'Socket is closed. Reconnect will be attempted in 1 second.',
    //   e.reason
    // );
    setTimeout(function () {
      createMessageSocket(endpoint);
    }, 1000);
  };

  connection.onerror = function (err) {
    console.error('Socket encountered error: ', err, 'Closing socket');
    connection.close();
  };

  return connection;
}
