import Sender from "./lib/sender";
import Receiver from "./lib/receiver";
import Archive from "./lib/archive";
import { serverUrl } from "./lib/const";

console.log(`hello from background.js`);
const ALLOW_OPTIONS = true;
const optionsPerUpload = new Map();

// TODO: remove this when no longer testing
async function uploadHandlerTest(account, { id, name, data }) {
  const server = await getServerUrl(account.id);
  setAccountConfigured(account.id);
  console.log(`handling upload to ${server}`);
  debugger;
  // This is the way
  return new Promise((resolve) => {
    resolve({
      url: "https://tsqrl.xyz/" + new Date().getTime(),
      aborted: false,
    });
  });
  // ===================================================
  // This is NOT the way:
  // return new Promise().resolve({
  //   url: "https://tsqrl.xyz/" + new Date().getTime(),
  //   aborted: false,
  // });
}

browser.cloudFile.onFileUpload.addListener(
  async (account, { id, name, data }) => {
    console.log(`🐈 here are account, id, name, and data`);
    console.log(account);
    console.log(id);
    console.log(name);
    console.log(data);
    console.log("------------------------");

    const archive = new Archive([data]);
    // const withPassword = false;
    // TODO: show the popup, giving the user an opportunity to
    // enter the password.

    const sender = new Sender();
    console.log("finished creating a Sender(), fire zee 🚀");
    const ownedFile = await sender.upload(archive);
    console.log(`secret message stored at ${ownedFile.url}`);

    return {
      url: ownedFile.url,
      aborted: false,
      templateInfo: {
        // service_icon: response.ok ? icon : null,
        // service_url: LINK ? send.service : null,
        // service_url: send.service,
        // download_expiry_date: {
        //   timestamp: expiresAt,
        // },
        // download_limit: upload.downloads,
        // download_password_protected: Boolean(upload.password),
      },
    };
  }
);

async function handleAbort(account, id, tab) {
  const upload = uploadMap.get(id);
  if (upload) {
    if (!upload.canceled) {
      upload.canceled = true;
      console.log(`handling abort`);
    }
  }
  // TODO: notify user
  return new Promise().resolve({});
}

browser.cloudFile.onFileUploadAbort.addListener(handleAbort);

async function handleDelete(account, id, tab) {
  const upload = uploadMap.get(id);
  if (upload) {
    console.log(`handling delete`);
    // TODO: call `getServerUrl` (or get the original URL passed into the upload)
    // then DELETE the item (so that the server removes it from db and from storage)
  }
  uploadMap.delete(id);
  return new Promise().resolve({});
}

browser.cloudFile.onFileDeleted.addListener(handleDelete);

// Essentially pub/sub for extensions:
// 1. User submits out popup form
// 2. Form handler calls runtime.sendMessage()
// 3. handleMessage() receives form data and calls sendResponse()
// 4. Form handler's .then() receives response, closes window
// onMessage listeners specifically should *not* be async
// Per https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage#sect3
function handleMessage(message, sender, sendResponse) {
  console.log(message);
  switch (message.type) {
    case "options":
      const { resolve } = optionsPerUpload.get(sender.tab.windowId);
      console.log(message.password); // just logging the password for now
      // but sending the whole message object to the resolve()
      // because we will add more props later.
      resolve(message);
      break;
    default:
      break;
  }
  sendResponse(); // Triggers popup to close window
}
messenger.runtime.onMessage.addListener(handleMessage);

async function createItem(url, userId) {
  const createItemUrl = `${serverUrl}/api/items`;
  const createItemFetchInfo = {
    mode: "cors",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url,
      sharedBy: userId,
    }),
  };
  const createItemResponse = await fetch(createItemUrl, createItemFetchInfo);

  if (!createItemResponse.ok) {
    console.log(
      "❌ Unable add create item in database",
      `Error: Unable to create db item for “${upload.file.name}” file.`
    );
    return;
  }
  const { item } = await createItemResponse.json();
  return item;
}

async function addItemToGroup(itemId, groupId) {
  const addItemToGroupUrl = `${serverUrl}/api/groups/${groupId}/items`;
  const addItemToGroupFetchInfo = {
    mode: "cors",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      itemId: itemId,
    }),
  };

  const addItemToGroupResponse = await fetch(
    addItemToGroupUrl,
    addItemToGroupFetchInfo
  );

  if (!addItemToGroupResponse.ok) {
    console.log(
      "❌ Unable add create item in database",
      `Error: Unable to create db item for item with id “${itemId}”.`
    );
  }
}

// Attaches handler for the custom button we specified
// in `manifest.json`
browser.composeAction.onClicked.addListener(async (tab) => {
  let details = await browser.compose.getComposeDetails(tab.id);
  let mimeType = details.isPlainText ? "text/plain" : "application/html";
  let { body } = details;
  console.log(mimeType);
  console.log(body);

  console.log(`^^^ this is what you're sending`);
  const blob = new Blob([body], {
    type: mimeType,
  });
  const archive = new Archive([blob]);
  // const withPassword = false;
  // TODO: show the popup, giving the user an opportunity to
  // enter the password.

  const sender = new Sender();
  console.log("finished creating a Sender(), fire zee 🚀");
  const file = await sender.upload(archive);
  console.log(`secret message stored at ${file.url}`);
  const item = await createItem(file.url, 1);
  addItemToGroup(item.id, 1);
});

async function awaitPopup() {
  async function popupPrompt(popupId, defaultResponse) {
    try {
      await messenger.windows.get(popupId);
    } catch (e) {
      // Window does not exist, assume closed.
      return defaultResponse;
    }
    return new Promise((resolve) => {
      let response = defaultResponse;
      function windowRemoveListener(closedId) {
        if (popupId == closedId) {
          messenger.windows.onRemoved.removeListener(windowRemoveListener);
          messenger.runtime.onMessage.removeListener(messageListener);
          resolve(response);
        }
      }
      function messageListener(request, sender, sendResponse) {
        if (sender.tab.windowId != popupId || !request) {
          return;
        }

        if (request.popupResponse) {
          response = request.popupResponse;
        }
        if (request.ping) {
          console.log("Background ping");
        }
      }
      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemoveListener);
    });
  }

  let window = await messenger.windows.create({
    url: "index.test.html",
    type: "popup",
    height: 720,
    width: 640,
    allowScriptsToClose: true,
  });
  // Wait for the popup to be closed and define a default return value if the
  // window is closed without clicking a button.
  let rv = await popupPrompt(window.id, "cancel");
  console.log(rv);
}
messenger.action.onClicked.addListener(awaitPopup);
// browser.action.onClicked.addListener(async (...args) => {
//   console.log(args);
//   const window = await browser.windows.create({
//     url: browser.runtime.getURL("/index.test.html"),
//     type: "popup",
//     // Should not be needed: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows/create#parameters
//     allowScriptsToClose: true,
//   });
// });
