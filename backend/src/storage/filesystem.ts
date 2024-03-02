import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { Config, Logger } from '../types/custom';

const stat = promisify(fs.stat);

export default class FSStorage {
  private log: Logger;
  private dir: string;

  constructor(config: Config, log?: Logger) {
    this.log = log;
    this.dir = config.file_dir;
    fs.mkdirSync(this.dir, {
      recursive: true,
    });
  }

  async length(id: string): Promise<number> {
    const result = await stat(path.join(this.dir, id));
    return result.size;
  }

  getStream(id: string): fs.ReadStream {
    // console.log(
    //   `we get(${id}) which is this fs path: ${path.join(this.dir, id)}`
    // );
    return fs.createReadStream(path.join(this.dir, id));
  }

  set(id: string, file: fs.ReadStream): Promise<void> {
    return new Promise((resolve, reject) => {
      const filepath = path.join(this.dir, id);
      console.log(
        `we just set ${filepath} for file (with id ${id}) the fs version of storage.set()`
      );
      const fstream = fs.createWriteStream(filepath);
      file.pipe(fstream);
      file.on('error', (err) => {
        fstream.destroy(err);
      });
      fstream.on('error', (err) => {
        fs.unlinkSync(filepath);
        reject(err);
      });
      fstream.on('finish', resolve);
    });
  }

  del(id: string): Promise<void> {
    return Promise.resolve(fs.unlinkSync(path.join(this.dir, id)));
  }

  ping(): Promise<void> {
    return Promise.resolve();
  }
}
