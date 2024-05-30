import anyTest, { TestFn } from 'ava';
import FSStorage from '../../storage/filesystem';
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

  t.context = {
    randomFileName,
    fileName,
    mockDataDir,
    filePath,
  };
});

test.afterEach.always((t) => {
  // Clean up if we have a failing test.
  // Otherwise, do nothing.
  try {
    fs.unlinkSync(`/tmp/${t.context.randomFileName}`);
  } catch (e) {
    // no-op
  }
});

test('sets the correct directory path', async (t) => {
  const config = { file_dir: '/tmp' };
  const storage = new FSStorage(config);
  t.is(storage.dir, config.file_dir);
});

test('returns the correct length of a file', async (t) => {
  const { fileName, mockDataDir, filePath } = t.context;
  const config = { file_dir: mockDataDir };
  const storage = new FSStorage(config);
  const expected = fs.statSync(filePath).size;
  const actual = await storage.length(fileName);
  t.is(expected, actual);
});

test('returns a valid read stream', (t) => {
  const { fileName, mockDataDir, filePath } = t.context;
  const config = { file_dir: mockDataDir };
  const storage = new FSStorage(config);
  const result = storage.getStream(fileName);

  // Confirm that path matches original
  t.is(result.path, filePath);
});

// Use test.serial because write/delete tests use same file name.
test.serial('writes a file to disk', async (t) => {
  const config = { file_dir: '/tmp' };
  const storage = new FSStorage(config);
  const { randomFileName, filePath } = t.context;
  await storage.set(t.context.randomFileName, fs.createReadStream(filePath));
  t.truthy(fs.existsSync(`/tmp/${randomFileName}`));
});

// Use test.serial because write/delete tests use same file name.
test.serial('deletes a file from disk', async (t) => {
  const config = { file_dir: '/tmp' };
  const storage = new FSStorage(config);
  const { randomFileName, filePath } = t.context;
  // We write the file using `storage.set`,
  // having confirmed this works in the previous test.
  await storage.set(randomFileName, fs.createReadStream(filePath));

  // This test asserts that we can also delete.
  await storage.del(randomFileName);
  t.false(fs.existsSync(`/tmp/${randomFileName}`));
});
