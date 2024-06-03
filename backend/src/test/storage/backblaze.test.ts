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
    type: StorageType.B2,
    bucketName: process.env.TEST_B2_BUCKET_NAME,
    applicationKeyId: process.env.TEST_B2_APPLICATION_KEY_ID,
    applicationKey: process.env.TEST_B2_APPLICATION_KEY,
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
