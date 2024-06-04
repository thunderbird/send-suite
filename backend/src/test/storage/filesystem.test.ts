import { expect, describe, it } from 'vitest';

import { FileStore } from '../../storage';
import {
  StorageType,
  StorageAdapterConfig,
} from '@tweedegolf/storage-abstraction';
import path from 'path';
import fs from 'fs';

describe(`Storage: Filesystem`, () => {
  const mockFile = 'file.txt';
  const mockDataDir = path.join(__dirname, 'data/');
  const mockFilePath = path.join(mockDataDir, mockFile);

  const config: StorageAdapterConfig = {
    type: StorageType.LOCAL,
    directory: process.env.TEST_FS_LOCAL_DIR,
    bucketName: process.env.TEST_FS_LOCAL_BUCKET,
  };

  const storage = new FileStore(config);

  it('should write a file to local filesystem', async () => {
    const fileName = `write-${new Date().getTime()}.txt`;

    const result = await storage.set(
      fileName,
      fs.createReadStream(mockFilePath)
    );
    expect(result).toBeTruthy();
  });

  it('should read a file from local filesystem', async () => {
    const fileName = `read-${new Date().getTime()}.txt`;

    const writeResult = await storage.set(
      fileName,
      fs.createReadStream(mockFilePath)
    );
    expect(writeResult).toBeTruthy();

    const readResult = await storage.get(fileName);
    expect(readResult).toBeTruthy();
  });

  it('should delete a file from local filesystem', async () => {
    const fileName = `delete-${new Date().getTime()}.txt`;

    const writeResult = await storage.set(
      fileName,
      fs.createReadStream(mockFilePath)
    );
    expect(writeResult).toBeTruthy();

    const readResult = await storage.get(fileName);
    expect(readResult).toBeTruthy();

    // Test fails unless we wait for the next tick in the event loop.
    setTimeout(async () => {
      const deleteResult = await storage.del(fileName);
      expect(deleteResult).toBeTruthy();
    }, 0);
  });
});
