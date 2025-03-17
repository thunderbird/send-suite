import { describe, expect, it } from 'vitest';

import {
  StorageAdapterConfig,
  StorageType,
} from '@tweedegolf/storage-abstraction';
import fs from 'fs';
import path from 'path';
import { FileStore } from '../../storage';
import { shouldRunSuite } from '../testutils';

const config: StorageAdapterConfig = {
  type: StorageType.B2,
  bucketName: process.env.TEST_B2_BUCKET_NAME,
  applicationKeyId: process.env.TEST_B2_APPLICATION_KEY_ID,
  applicationKey: process.env.TEST_B2_APPLICATION_KEY,
};

describe.runIf(shouldRunSuite(config, `Storage: Backblaze B2`))(
  `Storage: Backblaze B2`,
  () => {
    const mockFile = 'file.txt';
    const mockDataDir = path.join(__dirname, 'data/');
    const mockFilePath = path.join(mockDataDir, mockFile);

    const storage = new FileStore(config);

    it('should write a file to b2 bucket', async () => {
      const fileName = `write-${new Date().getTime()}.txt`;

      const result = await storage.set(
        fileName,
        fs.createReadStream(mockFilePath)
      );
      expect(result).toBeTruthy();
    });

    it('should read a file from b2 bucket', async () => {
      const fileName = `read-${new Date().getTime()}.txt`;

      const writeResult = await storage.set(
        fileName,
        fs.createReadStream(mockFilePath)
      );
      expect(writeResult).toBeTruthy();

      const readResult = await storage.get(fileName);
      expect(readResult).toBeTruthy();
    });

    it('should delete a file from b2 bucket', async () => {
      const fileName = `delete-${new Date().getTime()}.txt`;

      const writeResult = await storage.set(
        fileName,
        fs.createReadStream(mockFilePath)
      );
      expect(writeResult).toBeTruthy();

      const readResult = await storage.get(fileName);
      expect(readResult).toBeTruthy();

      const deleteResult = await storage.del(fileName);
      expect(deleteResult).toBeTruthy();
    });
  }
);
