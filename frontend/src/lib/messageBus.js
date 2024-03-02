/*
what's this thing supposed to do?
on the backend, we have the messagebus, which is just a broadcast server.
It doesn't do any filtering yet.

Do we need a thing that corresponds?
I think we were using it for handling heartbeats...
and for notifying of:
- new messages
- new convos
- burned convos

ok, the message bus should wrap all of the `onNewChat` etc.

it uses the new message socket, so it should probably encapsulate that, as well

*/

import { createMessageSocket } from './messageSocket';

export class MessageBus {
  constructor(serverUrl) {
    // using new URL() trims off excess whitespace and trailing '/'
    const u = new URL(serverUrl);
    this.serverUrl = `wss://${u.host}/api/messagebus`;
    this.socket = null;
    this.callbackMap = {};
  }

  addCallback(type, cb) {
    const cbArray = this.callbackMap[type] ?? [];
    cbArray.push(cb);
    this.callbackMap[type] = cbArray;
  }

  async initConnection(userId) {
    try {
      this.socket = await createMessageSocket(`${this.serverUrl}/${userId}`);
      this.socket.onmessage = this.handleMessage;
      return true;
    } catch (e) {
      console.log(`🤡 could not connect message socket`);
      console.log(e);
      return false;
    }
  }

  send(dataObj) {
    console.log(`🚀 Sending data over MessageBus`);
    this.socket.send(dataObj);
  }

  // Avoiding weirdness with `this`
  handleMessage = (event) => {
    console.log(`heard from the messageSocket`);
    console.log(event.data);

    const data = JSON.parse(event.data);
    if (!data) {
      console.log(`No data in message`);
      return;
    }
    if (!(data?.type in this.callbackMap)) {
      console.log(`Could not find ${data?.type} in this.callbackMap`);
      return;
    }
    const callbacks = this.callbackMap[data?.type];
    if (callbacks) {
      callbacks.forEach((cb) => {
        cb(data);
      });
    }
    // switch (data?.type) {
    //   case 'burn':
    //     if (data?.conversationId) {
    //       cleanAfterBurning(data.conversationId);
    //     }
    //     break;
    //   case 'newMessage':
    //     if (data?.conversationId) {
    //       newMessageCallbacks.forEach((cb) => {
    //         cb(data.conversationId);
    //       });
    //     }
    //     break;
    //   case 'newChat':
    //     newChatCallbacks.forEach((cb) => {
    //       cb();
    //     });
    //   default:
    //     break;
    // }
  };
}
