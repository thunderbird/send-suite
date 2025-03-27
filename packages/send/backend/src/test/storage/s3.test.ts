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
  type: StorageType.S3,
  region: process.env.TEST_S3_REGION || 'auto',
  bucketName: process.env.TEST_S3_BUCKET_NAME,
  endpoint: process.env.TEST_S3_ENDPOINT,
  accessKeyId: process.env.TEST_S3_ACCESS_KEY,
  secretAccessKey: process.env.TEST_S3_SECRET_KEY,
};

describe.runIf(shouldRunSuite(config, 'Storage: S3-compatible'))(
  `Storage: S3-compatible`,
  () => {
    const mockFile = 'file.txt';
    const mockDataDir = path.join(__dirname, 'data/');
    const mockFilePath = path.join(mockDataDir, mockFile);

    const storage = new FileStore(config);

    it('should write a file to s3 bucket', async () => {
      const fileName = `write-${new Date().getTime()}.txt`;

      const result = await storage.set(
        fileName,
        fs.createReadStream(mockFilePath)
      );
      expect(result).toBeTruthy();
    });

    it('should read a file from s3 bucket', async () => {
      const fileName = `read-${new Date().getTime()}.txt`;

      const writeResult = await storage.set(
        fileName,
        fs.createReadStream(mockFilePath)
      );
      expect(writeResult).toBeTruthy();

      const readResult = await storage.get(fileName);
      expect(readResult).toBeTruthy();
    });

    it('should delete a file from s3 bucket', async () => {
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
