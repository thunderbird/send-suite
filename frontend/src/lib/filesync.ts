import { ProgressTracker } from '@/apps/lockbox/stores/status-store';
import { decryptStream } from '@/lib/ece';
import { _download, encrypt, uploadWithTracker } from '@/lib/helpers';
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
  type = 'text/plain',
  api: ApiConnection
): Promise<string | void> {
  try {
    const bucketResponse = await api.call<{ url: string }>(
      `download/${id}/signed`
    );

    if (!bucketResponse?.url) {
      throw new Error('BUCKET_URL_NOT_FOUND');
    }

    const downloadedBlob = await _download(bucketResponse.url);
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
  } catch (error) {
    console.error('DOWNLOAD_FAILED', error);
    throw error;
  }
}

export async function sendBlob(
  blob: Blob,
  aesKey: CryptoKey,
  api: ApiConnection,
  progressTracker: ProgressTracker
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

    progressTracker.setText('Encrypting file');
    const encrypted = await encrypt(stream, aesKey, progressTracker);

    progressTracker.setProgress(0);
    progressTracker.setText('Uploading file');

    // Create a ReadableStream from the Uint8Array
    const readableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encrypted);
        controller.close();
      },
    });

    await uploadWithTracker({
      url,
      readableStream,
      progressTracker,
    });
    return id;
  } catch (error) {
    throw new Error('UPLOAD_FAILED');
  }
}
