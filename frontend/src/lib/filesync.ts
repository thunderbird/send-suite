import { streamToArrayBuffer } from '@/lib/utils';
import { blobStream } from '@/lib/streams';
import { decryptStream } from '@/lib/ece';
import { _download, _upload } from '@/lib/helpers';

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
    let plainStream = decryptStream(blobStream(downloadedBlob), key);
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

export async function sendBlob(blob: Blob, aesKey: CryptoKey): Promise<string> {
  const stream = blobStream(blob);
  const result = await _upload(stream, aesKey);
  // Using a type guard since a JsonResponse can be a single object or an array
  if (Array.isArray(result)) {
    return result[0].id;
  } else {
    return result.id;
  }
}
