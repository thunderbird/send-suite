import crypto from 'crypto';
import { Transform } from 'stream';
import storage from './storage';
import config from './config';
import S3Storage from './storage/s3';

const s3 = new S3Storage(null);

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
  const fileInfo = JSON.parse(message);

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
  // await storage.set(uploadId, fileStream);
  await s3.set(uploadId, fileStream);
  if (ws.readyState === 1) {
    // if the socket is closed by a canceled upload the stream
    // ends without an error so we need to check the state
    // before sending a reply.

    // TODO: we should handle canceled uploads differently
    // in order to avoid having to check socket state and clean
    // up storage, possibly with an exception that we can catch.
    ws.send(
      JSON.stringify({
        ok: true,
        id: uploadId,
      })
    );
    // Note: we omit the entire `statUploadEvent` found in the
    // original code. That was likely for usage metrics.
  }
}

export default function (ws, req) {
  let fileStream;

  ws.on('close', (e) => {
    if (e !== 1000 && fileStream !== undefined) {
      fileStream.destroy();
    }
  });

  ws.once('message', async function (message) {
    try {
      await handleUpload(ws, message, fileStream);
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
