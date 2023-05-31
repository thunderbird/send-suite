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

const btnGetGroupsForUser = document.querySelector("#get-groups-for-user");
const btnCreateGroup = document.querySelector("#create-group");
const btnAddUserToGroup = document.querySelector("#add-user-to-group");
const groupFileList = document.querySelector("#group-file-list");
const currentGroupList = document.querySelector("#current-groups");

async function getOwnedFiles() {}

const newGroup = (groupId) => {
  const el = document.createElement("a");
  el.href = "#";
  el.textContent = `${groupId}`;
  el.addEventListener("click", (event) => {
    event.preventDefault();
    groupIdInput.value = groupId;
  });
  const li = document.createElement("li");
  li.appendChild(el);
  return li;
};

async function getGroupsForUser(userId) {
  const getGroupsForUserUrl = `${serverUrl}/api/users/${userId}`;

  const getGroupsForUserResponse = await fetch(getGroupsForUserUrl);
  if (!getGroupsForUserResponse.ok) {
    console.log(`Can't get items for group`);
    return;
  }
  currentGroupList.innerHTML = "";
  const { groups } = await getGroupsForUserResponse.json();
  for (let { groupId } of groups) {
    currentGroupList.appendChild(newGroup(groupId));
  }
}

btnGetGroupsForUser.addEventListener("click", (event) => {
  event.preventDefault();
  getGroupsForUser(userIdInput.value);
});

async function createNewGroup() {
  const createGroupUrl = `${serverUrl}/api/groups/`;
  const createGroupFetchInfo = {
    mode: "cors",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  };

  const createGroupResponse = await fetch(createGroupUrl, createGroupFetchInfo);

  if (!createGroupResponse.ok) {
    console.log(`Unable to add user to group`);
    return;
  }
  alert("group created");
  const { group } = await createGroupResponse.json();
  console.log(group);
  groupIdInput.value = group.id;
}
btnCreateGroup.addEventListener("click", createNewGroup);

async function addUserToGroup(userId, groupId) {
  const addUserToGroupUrl = `${serverUrl}/api/groups/${groupId}/members`;
  const addUserToGroupFetchInfo = {
    mode: "cors",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      userId,
    }),
  };

  const addUserToGroupResponse = await fetch(
    addUserToGroupUrl,
    addUserToGroupFetchInfo
  );

  if (!addUserToGroupResponse.ok) {
    console.log(`Unable to add user to group`);
  }
}
btnAddUserToGroup.addEventListener("click", (event) => {
  event.preventDefault();
  addUserToGroup(userIdInput.value, groupIdInput.value);
});

async function getGroupFiles(groupId) {
  const getItemsForGroupUrl = `${serverUrl}/api/groups/${groupId}/items`;

  const getItemsForGroupResponse = await fetch(getItemsForGroupUrl);
  if (!getItemsForGroupResponse.ok) {
    console.log(`Can't get items for group`);
    return;
  }
  return getItemsForGroupResponse.json();
}

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

const newListItem = ({ id, url }) => {
  const el = document.createElement("a");
  el.href = "#";
  el.textContent = `${id}: ${url}`;
  el.addEventListener("click", (event) => {
    event.preventDefault();
    urlSpan.value = url;
  });
  const li = document.createElement("li");
  li.appendChild(el);
  return li;
};

const btnGetGroupFiles = document.querySelector("#get-group-file-list");
btnGetGroupFiles.addEventListener("click", async () => {
  groupFileList.innerHTML = "";
  console.log("did anyone share? do they care?");
  // debugger;
  // addItemToGroup(currentItem.id, groupIdInput.value);
  const { items } = await getGroupFiles(groupIdInput.value);
  console.log(items);
  for (let { item } of items) {
    console.log(item);
    groupFileList.appendChild(newListItem(item));
  }
});
