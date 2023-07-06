// export const SEND_SERVER = {
//   hostname: "localhost",
//   port: 8088,
//   protocol: "https:",
// };

// need to get rid of this, in favor of api.js getting
// configured via closure (or something)
// and then provided to descendants
export const SEND_SERVER = {
  hostname: "ec2-54-191-45-104.us-west-2.compute.amazonaws.com",
  port: 443,
  protocol: "https:",
};
export const serverUrl = `${SEND_SERVER.protocol}//${SEND_SERVER.hostname}:${SEND_SERVER.port}`;

export const ITEM_TYPES = {
  MESSAGE: "MESSAGE",
  FILE: "FILE",
};

export const STORAGE_KEY = "send-suite/";

export const keyFor = (name) => STORAGE_KEY + "/" + name;
