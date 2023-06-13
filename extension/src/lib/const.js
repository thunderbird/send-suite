export const SEND_SERVER = {
  hostname: "localhost",
  port: 8088,
  protocol: "https:",
};

export const ITEM_TYPES = {
  MESSAGE: "MESSAGE",
  FILE: "FILE",
};

export const serverUrl = `${SEND_SERVER.protocol}//${SEND_SERVER.hostname}:${SEND_SERVER.port}`;

export const STORAGE_KEY = "send-suite/";

export const keyFor = (name) => STORAGE_KEY + "name";
