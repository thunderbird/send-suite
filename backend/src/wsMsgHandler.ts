export default function (ws, clients) {
  console.log(`wsHandler initialized`);

  ws.on('message', (msgString) => {
    const msg = JSON.parse(msgString);
    console.log(`📣 broadcasting`);
    console.log(msg);
    [...clients.keys()].forEach((key) => {
      const client = clients.get(key);
      console.log(`sending to client ${key}`);
      // console.log(client);
      // client.send('{msg: "hello"}');
      // Unsure why I need to parse and re-stringify?
      client.send(JSON.stringify(msg));
    });
  });
}
