import { afterAll, describe, expect, it } from 'vitest';

import {
  StorageAdapterConfig,
  StorageType,
} from '@tweedegolf/storage-abstraction';
import fs from 'fs';
import path from 'path';
import { FileStore } from '../../storage';

describe(`Storage: Filesystem`, () => {
  const mockFile = 'file.txt';
  const mockDataDir = path.join(__dirname, 'data/');
  const mockFilePath = path.join(mockDataDir, mockFile);

  const files: string[] = [];

  const config: StorageAdapterConfig = {
    type: StorageType.LOCAL,
    directory: process.env.TEST_FS_LOCAL_DIR,
    bucketName: process.env.TEST_FS_LOCAL_BUCKET,
  };

  const storage = new FileStore(config);

  afterAll(() => {
    files.forEach(async (file) => {
      await storage.del(file);
    });
  });

  it('should write a file to local filesystem', async () => {
    const fileName = `write-${new Date().getTime()}.txt`;

    const result = await storage.set(
      fileName,
      fs.createReadStream(mockFilePath)
    );
    files.push(fileName);
    expect(result).toBeTruthy();
  });

  it('should read a file from local filesystem', async () => {
    const fileName = `read-${new Date().getTime()}.txt`;

    const writeResult = await storage.set(
      fileName,
      fs.createReadStream(mockFilePath)
    );
    files.push(fileName);
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

    // Test fails on Linux unless we wait for the next tick in the event loop.
    setTimeout(async () => {
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async () => {
        const deleteResult = await storage.del(fileName);
        expect(deleteResult).toBeTruthy();
      });
    }, 0);
  });
});
