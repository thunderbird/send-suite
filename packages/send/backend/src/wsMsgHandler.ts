export default function (ws, clients) {
  ws.on('message', (msgString) => {
    const msg = JSON.parse(msgString);
    [...clients.keys()].forEach((key) => {
      const client = clients.get(key);
      // TODO: figure out why I had to parse and then re-stringify.
      client.send(JSON.stringify(msg));
    });
  });
}
