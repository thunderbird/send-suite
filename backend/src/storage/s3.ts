import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import stream from 'stream';
import { Config, Logger } from '../types/custom';

// TODO: use dynamic buckets
const Bucket = 'lockbox-send-dummy-bucket';

export default class S3Storage {
  private log: Logger;
  private s3Client: S3Client;

  constructor(config: Config, log?: Logger) {
    this.log = log;
    this.s3Client = new S3Client({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      region: 'us-east-2', // I guess put this in .env?
    });
  }

  async getStream(id: string) {}

  // Courtesy of https://stackoverflow.com/a/73332454
  set(Key: string, readableStream: fs.ReadStream): Promise<void> {
    const client = this.s3Client;
    return new Promise(async (resolve, reject) => {
      try {
        const uploadProcess = new Upload({
          client,
          params: {
            Bucket,
            Key,
            Body: readableStream,
          },
          queueSize: 4,
          partSize: 1024 * 1024 * 5,
          leavePartsOnError: false,
        });
        await uploadProcess.done();
        console.log(`🥳🥳🥳🥳🥳🥳🥳🥳🥳🥳🥳`);
        console.log(`you invented a new element`);
        resolve();
      } catch (e) {
        console.log(`💩💩💩💩💩💩💩💩💩💩💩`);
        // Errors without specifying region for S3Client
        // Errors with Access Denied
        console.log(e);
        reject(e);
      }
    });
  }
}
