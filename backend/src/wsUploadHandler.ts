import crypto from 'crypto';
import { Transform } from 'stream';
import storage from './storage';
import config from './config';

const ECE_RECORD_SIZE = 1024 * 64;
const TAG_LENGTH = 16;
function encryptedSize(
  size: number,
  rs = ECE_RECORD_SIZE,
  tagLength = TAG_LENGTH
) {
  const chunk_meta = tagLength + 1; // Chunk metadata, tag and delimiter
  return 21 + size + chunk_meta * Math.ceil(size / (rs - chunk_meta));
}

class Limiter extends Transform {
  private length: number;
  private limit: number;

  constructor(limit: number) {
    super();
    this.limit = limit;
    this.length = 0;
  }

  _transform(
    chunk: string,
    encoding: string,
    callback: (arg0?: Error) => void
  ) {
    this.length += chunk.length;
    this.push(chunk);
    if (this.length > this.limit) {
      console.error('LIMIT', this.length, this.limit);
      return callback(new Error('limit'));
    }
    callback();
  }
}

async function handleUpload(ws, message, fileStream) {
  const uploadId = crypto.randomBytes(24).toString('hex');
  // const owner = crypto.randomBytes(10).toString('hex');

  const fileInfo = JSON.parse(message);
  // const timeLimit = fileInfo.timeLimit || config.default_expire_seconds;
  // const dlimit = fileInfo.dlimit || config.default_downloads;
  // const metadata = fileInfo.fileMetadata;
  // const auth = fileInfo.authorization;

  // const meta = {
  //   owner,
  //   // `fxa` key is omitted here
  //   metadata,
  //   dlimit,
  //   auth: auth.split(' ')[1],
  //   nonce: crypto.randomBytes(16).toString('base64'),
  // };

  // const url = `${deriveBaseUrl(req)}/download/${newId}/`;

  // ws.send(
  //   JSON.stringify({
  //     url,
  //     ownerToken: meta.owner,
  //     id: newId,
  //   })
  // );
  console.log(fileInfo);
  ws.send(
    JSON.stringify({
      id: uploadId,
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
  // TODO: cancel upload if we hit the limit
  const limiter = new Limiter(encryptedSize(config.max_file_size));

  const wsStream = ws.constructor.createWebSocketStream(ws);
  fileStream = wsStream.pipe(eof).pipe(limiter); // limiter needs to be the last in the chain

  // Remember: storage is `storage/index.js`
  // which hands off to the underlying storage mechanism.
  await storage.set(uploadId, fileStream);
  if (ws.readyState === 1) {
    // if the socket is closed by a cancelled upload the stream
    // ends without an error so we need to check the state
    // before sending a reply.

    // TODO: we should handle cancelled uploads differently
    // in order to avoid having to check socket state and clean
    // up storage, possibly with an exception that we can catch.
    ws.send(
      JSON.stringify({
        ok: true,
        id: uploadId,
      })
    );
    // Omits the entire `statUploadEvent`
    // I wonder if that's mozilla metrics? (looks like it)
  }
}

// async function handleDownload(ws, message) {
//   const fileInfo = JSON.parse(message);
//   const { id } = fileInfo;
//   console.log(`they want to download ${id}`);
//   const contentLength = await storage.length(id);
//   const fileStream = await storage.get(id);

//   const wsStream = ws.constructor.createWebSocketStream(ws);
//   fileStream.pipe(wsStream);
// }

export default function (ws, req) {
  console.log(`wsHandler initialized`);
  let fileStream;

  ws.on('close', (e) => {
    if (e !== 1000 && fileStream !== undefined) {
      fileStream.destroy();
    }
  });

  ws.once('message', async function (message) {
    try {
      await handleUpload(ws, message, fileStream);
      // Could I create the Upload db item here?
      // I'd need the user's id, which I could get from the `req`.
      // But I need the auth middleware, first
      // In addition, I'd need the size of the original file
    } catch (e) {
      console.error('upload', e);
      if (ws.readyState === 1) {
        ws.send(
          JSON.stringify({
            error: e === 'limit' ? 413 : 500,
          })
        );
      }
    }
    ws.close();
  });
}
