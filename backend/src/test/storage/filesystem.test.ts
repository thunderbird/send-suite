import test from 'ava';
import FSStorage from '../../storage/filesystem';
import path from 'path';
import fs from 'fs';

test('sets the correct directory path', async (t) => {
  const config = { file_dir: '/tmp' };
  const storage = new FSStorage(config);
  t.is(storage.dir, config.file_dir);
});

test('returns the correct length of a file', async (t) => {
  const fname = 'file.txt';
  const mockDataDir = path.join(__dirname, 'data/');
  const filePath = path.join(mockDataDir, fname);
  const config = { file_dir: mockDataDir };
  const storage = new FSStorage(config);
  const expected = fs.statSync(filePath).size;
  const actual = await storage.length(fname);
  t.is(expected, actual);
});

test('returns a valid read stream', (t) => {
  const fname = 'file.txt';
  const mockDataDir = path.join(__dirname, 'data/');
  const filePath = path.join(mockDataDir, fname);
  const config = { file_dir: mockDataDir };
  const storage = new FSStorage(config);
  const result = storage.getStream(fname);

  // Confirm that path matches original
  t.is(result.path, filePath);
});

test('writes a file to disk', async (t) => {
  const randomFileName = `${new Date().getTime()}.txt`;
  const fname = 'file.txt';
  const mockDataDir = path.join(__dirname, 'data/');
  const filePath = path.join(mockDataDir, fname);
  const config = { file_dir: '/tmp' };
  const storage = new FSStorage(config);
  await storage.set(randomFileName, fs.createReadStream(filePath));
  t.truthy(fs.existsSync(`/tmp/${randomFileName}`));
  t.teardown(() => {
    // clean up
    fs.unlinkSync(`/tmp/${randomFileName}`);
  });
});

test('deletes a file from disk', async (t) => {
  const randomFileName = `${new Date().getTime()}.txt`;
  const fname = 'file.txt';
  const mockDataDir = path.join(__dirname, 'data/');
  const filePath = path.join(mockDataDir, fname);
  const config = { file_dir: '/tmp' };
  const storage = new FSStorage(config);

  // We write the file using storage.set,
  // having confirmed this works in the previous test.
  await storage.set(randomFileName, fs.createReadStream(filePath));

  // This test asserts that we can also delete.
  await storage.del(randomFileName);
  t.false(fs.existsSync(`/tmp/${randomFileName}`));
});
