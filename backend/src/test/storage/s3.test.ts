import anyTest, { TestFn } from 'ava';
import { FileStore } from '../../storage/';
import {
  StorageType,
  StorageAdapterConfig,
} from '@tweedegolf/storage-abstraction';
import path from 'path';
import fs from 'fs';

// Allow any property to be added to `t.context`
// https://github.com/avajs/ava/blob/main/docs/recipes/typescript.md#typing-tcontext
const test = anyTest as TestFn<Record<string, any>>;

// Put file and path names in test context before running any tests.
test.before((t) => {
  const randomFileName = `${new Date().getTime()}.txt`;
  const fileName = 'file.txt';
  const mockDataDir = path.join(__dirname, 'data/');
  const filePath = path.join(mockDataDir, fileName);

  const config: StorageAdapterConfig = {
    type: StorageType.S3,
    region: process.env.TEST_S3_REGION || 'auto',
    bucketName: process.env.TEST_S3_BUCKET_NAME,
    endpoint: process.env.TEST_S3_ENDPOINT,
    accessKeyId: process.env.TEST_S3_ACCESS_KEY,
    secretAccessKey: process.env.TEST_S3_SECRET_KEY,
  };

  t.context = {
    config,
    randomFileName,
    fileName,
    mockDataDir,
    filePath,
  };
});

test.serial('writes a file to bucket', async (t) => {
  const { randomFileName, filePath, config } = t.context;
  const storage = new FileStore(config);
  const result = await storage.set(
    randomFileName,
    fs.createReadStream(filePath)
  );

  t.true(result);
});

test.serial('returns a valid read stream from bucket', async (t) => {
  const { randomFileName, config } = t.context;
  const storage = new FileStore(config);
  const result = await storage.get(randomFileName);
  t.truthy(result);
});

test.serial('deletes file from bucket', async (t) => {
  const { randomFileName, config } = t.context;
  const storage = new FileStore(config);
  const result = await storage.del(randomFileName);
  t.truthy(result);
});
