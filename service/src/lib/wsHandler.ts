import crypto from "crypto";
import { Transform } from "stream";
import storage from "../storage";
import Limiter from "./limiter";
import config, { deriveBaseUrl } from "../config";

const ECE_RECORD_SIZE = 1024 * 64;
const TAG_LENGTH = 16;
function encryptedSize(size, rs = ECE_RECORD_SIZE, tagLength = TAG_LENGTH) {
  const chunk_meta = tagLength + 1; // Chunk metadata, tag and delimiter
  return 21 + size + chunk_meta * Math.ceil(size / (rs - chunk_meta));
}

/*
Uploads happen in two parts:
- a preamble (the metadata)
- a second stream handler (to which you pass in existing `ws`)
*/
async function handleUpload(req, ws, message, fileStream) {
  const newId = crypto.randomBytes(8).toString("hex");
  const owner = crypto.randomBytes(10).toString("hex");

  const fileInfo = JSON.parse(message);
  const timeLimit = fileInfo.timeLimit || config.default_expire_seconds;
  const dlimit = fileInfo.dlimit || config.default_downloads;
  const metadata = fileInfo.fileMetadata;
  const auth = fileInfo.authorization;

  const meta = {
    owner,
    // `fxa` key is omitted here
    metadata,
    dlimit,
    auth: auth.split(" ")[1],
    nonce: crypto.randomBytes(16).toString("base64"),
  };

  const url = `${deriveBaseUrl(req)}/download/${newId}/`;

  ws.send(
    JSON.stringify({
      url,
      ownerToken: meta.owner,
      id: newId,
    })
  );

  // This sends chunks until we reach the last chunk.
  // I think this is a translation of NUL-termination.
  const eof = new Transform({
    transform: function (chunk, encoding, callback) {
      if (chunk.length === 1 && chunk[0] === 0) {
        this.push(null);
      } else {
        this.push(chunk);
      }
      callback();
    },
  });

  // The Limiter makes sure we're not receiving more than
  // the maximum file size allowed.
  // If we do, we cancel the
  const limiter = new Limiter(encryptedSize(config.max_file_size));

  const wsStream = ws.constructor.createWebSocketStream(ws);
  fileStream = wsStream.pipe(eof).pipe(limiter); // limiter needs to be the last in the chain
  // console.log(`OMITTING THE ACTUAL STORAGE FOR NOW`);
  // console.log(newId);
  // console.log(fileStream);
  // console.log(meta);
  // console.log(timeLimit);

  // Remember: storage is `storage/index.js`
  // which hands off to the underlying storage mechanism.
  await storage.set(newId, fileStream, meta, timeLimit);
  if (ws.readyState === 1) {
    // if the socket is closed by a cancelled upload the stream
    // ends without an error so we need to check the state
    // before sending a reply.

    // TODO: we should handle cancelled uploads differently
    // in order to avoid having to check socket state and clean
    // up storage, possibly with an exception that we can catch.
    ws.send(JSON.stringify({ ok: true }));

    // Omits the entire `statUploadEvent`
    // I wonder if that's mozilla metrics? (looks like it)
  }
}

export default function (ws, req) {
  console.log(`wsHandler initialized`);
  let fileStream;

  ws.on("close", (e) => {
    if (e !== 1000 && fileStream !== undefined) {
      fileStream.destroy();
    }
  });

  ws.once("message", async function (message) {
    try {
      console.log("yonder, the message");
      console.log(message.toString());

      // we could either:
      // accept a pre-message message that indicates
      // whether we're uploading or downloading
      // if we have a pre-message, then we need to do the
      // attach/detach thing that other parts of the code are doing, yes?
      await handleUpload(req, ws, message, fileStream);
    } catch (e) {
      console.error("upload", e);
      if (ws.readyState === 1) {
        ws.send(
          JSON.stringify({
            error: e === "limit" ? 413 : 500,
          })
        );
      }
    }
    ws.close();
  });
}
