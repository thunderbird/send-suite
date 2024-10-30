import { decryptStream } from '@/lib/ece';
import { _download, encrypt } from '@/lib/helpers';
import { blobStream } from '@/lib/streams';
import { streamToArrayBuffer } from '@/lib/utils';
import { ApiConnection } from './api';

export type NamedBlob = Blob & { name: string };

export type Canceler = Record<string, () => void>;

async function _saveFile(file: Record<string, any>): Promise<void> {
  return new Promise(function (resolve) {
    const dataView = new DataView(file.plaintext);
    const blob = new Blob([dataView], { type: file.type });

    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      resolve();
    }, 0);
  });
}

export async function getBlob(
  id: string,
  size: number,
  key: CryptoKey,
  isMessage = true,
  filename = 'dummy.file',
  type = 'text/plain'
): Promise<string | void> {
  const downloadedBlob = await _download(id);

  let plaintext: ArrayBufferLike | string;
  if (key) {
    const plainStream = decryptStream(blobStream(downloadedBlob), key);
    plaintext = await streamToArrayBuffer(plainStream, size);
  } else {
    plaintext = await downloadedBlob.arrayBuffer();
  }

  if (isMessage) {
    const decoder = new TextDecoder();
    const plaintextString = decoder.decode(plaintext);
    return plaintextString;
  } else {
    return await _saveFile({
      plaintext,
      name: decodeURIComponent(filename),
      type, // mime type of the upload
    });
  }
}

export async function sendBlob(
  blob: Blob,
  aesKey: CryptoKey,
  api: ApiConnection,
  progressTracker: (progress: number) => void
): Promise<string> {
  const stream = blobStream(blob);
  try {
    // Get the bucket url
    const { id, url } = await api.call<{ url: string; id: string }>(
      'uploads/signed',
      {
        type: 'application/octet-stream',
      },
      'POST'
    );

    const encrypted = await encrypt(stream, aesKey, {
      progressTracker,
    });

    // Upload directly to bucket
    await fetch(url, {
      body: encrypted,
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
    });

    return id;
  } catch (error) {
    throw new Error('UPLOAD_FAILED');
  }
}
