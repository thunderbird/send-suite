import Sender from "./lib/sender";
import Receiver from "./lib/receiver";
import Archive from "./lib/archive";
import { serverUrl } from "./lib/const";
let currentUrl;
let file;

const urlSpan = document.querySelector("#url");
urlSpan.value = "";
async function doUpload() {
  const blob = new Blob(
    [
      `
${new Date().getTime()} hello world, how are you?
lorem ipsum.
  `,
    ],
    { type: "text/plain" }
  );
  blob.name = "hello.txt";
  const archive = new Archive([blob]);

  const sender = new Sender();
  console.log("finished creating a Sender(), fire zee 🚀");

  const file = await sender.upload(archive);
  /*
  Upload flow:
  - Sender.upload()
  - Keychain.encryptStream()
  - Keychain.encryptMetadata()
  - Keychain.authKeyB64()
  - api.uploadWs()
  - api.upload()

  */
  console.log(file.toJSON());
  currentUrl = file.url; // the url is useful, but not the nonce.
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
    await receiver.download({
      noSave: false, // You do want to save
      // ignoring the stream option for now
      // stream: false,
    });
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
