import Sender from "./lib/sender";
import Receiver from "./lib/receiver";
import Archive from "./lib/archive";
import { serverUrl } from "./lib/const";

let currentUrl;

let currentItem;
const urlSpan = document.querySelector("#url");
urlSpan.value = "";

const textInput = document.querySelector("#text-content");
const userIdInput = document.querySelector("#user-id");
const groupIdInput = document.querySelector("#group-id");

const shouldSaveCheckbox = document.querySelector("#save-file");
const shouldNotSave = () => !shouldSaveCheckbox.checked;

const decodedMessageTextArea = document.querySelector("#decoded-message");

async function getOwnedFiles() {}

async function getGroupFiles() {}

async function createItem(url, userId) {
  const createItemUrl = `${serverUrl}/api/items`;
  const createItemFetchInfo = {
    mode: "cors",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url,
      metadata: "{}",
      sharedBy: userId,
    }),
  };
  const createItemResponse = await fetch(createItemUrl, createItemFetchInfo);

  if (!createItemResponse.ok) {
    console.log(
      "❌ Unable add create item in database",
      `Error: Unable to create db item for “${upload.file.name}” file.`
    );
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

async function doUpload() {
  const blob = new Blob([textInput.value], { type: "text/plain" });
  blob.name = `${new Date().getTime()}.txt`;
  const archive = new Archive([blob]);

  const sender = new Sender();
  console.log("finished creating a Sender(), fire zee 🚀");
  /*
  Upload flow:
  - Sender.upload()
  - Keychain.encryptStream()
  - Keychain.encryptMetadata()
  - Keychain.authKeyB64()
  - api.uploadWs()
  - api.upload()
  */
  const file = await sender.upload(archive);
  console.log(file.toJSON());
  currentUrl = file.url;

  /*
  Create a new item in the database that:
  - is owned by this user
  - is identified by the currentUrl
  */
  currentItem = await createItem(file.url, userIdInput.value);
}

async function doDownload(_url) {
  if (!_url) {
    console.log(`No url provided`);
    return; // nothing to download
  }
  const url = new URL(_url);
  const secretKey = url.hash.substring(1);
  const id = url.pathname.split("/")[2];
  const result = await fetch(url.href);
  if (result.ok) {
    const data = await result.json();
    const receiver = new Receiver({
      secretKey, // Not so secret - it's the hash at the end of the URL
      id,
      url,
      nonce: data?.metadata?.nonce,
      requiresPassword: false,
    });
    await receiver.getMetadata();
    const optionalContent = await receiver.download({
      noSave: shouldNotSave(), // You do want to save
      // ignoring the stream option for now
      // stream: false,
    });
    if (optionalContent) {
      decodedMessageTextArea.value = optionalContent;
    }
  } else {
    throw new Error(result.response.status);
  }
}

const btnSend = document.querySelector("#send");
btnSend.addEventListener("click", async () => {
  console.log("3..2..1..uploading");
  await doUpload();
  urlSpan.value = currentUrl;
});

const btnReceive = document.querySelector("#receive");
btnReceive.addEventListener("click", async () => {
  console.log("1..2..3..downloading");
  await doDownload(urlSpan.value);
});

const btnShare = document.querySelector("#share-to-group");
btnShare.addEventListener("click", async () => {
  console.log("sharing is caring");
  // debugger;
  addItemToGroup(currentItem.id, groupIdInput.value);
});
