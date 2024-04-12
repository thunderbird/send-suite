import {
  S3Client,
  GetObjectAttributesCommand,
  ObjectAttributes,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

import fs from 'fs';
import { Readable } from 'stream';
import { Config, Logger } from '../types/custom';
import { fromIni } from '@aws-sdk/credential-providers';

const Bucket = process.env.AWS_S3_BUCKET_URL;
const region = process.env.AWS_DEFAULT_REGION;

const queueSize = 4;
const partSize = 1024 * 1024 * 5;

export default class S3Storage {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region,
      // For manual configuration during development
      bucketEndpoint: true,
      credentials: fromIni({
        filepath: 'aws/credentials',
        configFilepath: 'aws/config',
      }),
    });
  }

  async getStream(Key: string): Promise<Readable> {
    try {
      const input = {
        Bucket,
        Key,
      };
      const command = new GetObjectCommand(input);
      const response = await this.s3Client.send(command);
      return response.Body as Readable;
    } catch (e) {}
  }

  async length(Key: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        const input = {
          Bucket,
          Key,
          ObjectAttributes: [ObjectAttributes.OBJECT_SIZE],
        };
        const command = new GetObjectAttributesCommand(input);
        const response = await this.s3Client.send(command);
        resolve(response.ObjectSize);
      } catch (e) {
        reject(e);
      }
    });
  }

  // Courtesy of https://stackoverflow.com/a/73332454
  set(Key: string, readableStream: fs.ReadStream): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const uploadProcess = new Upload({
          client: this.s3Client,
          params: {
            Bucket,
            Key,
            Body: readableStream,
          },
          queueSize,
          partSize,
          leavePartsOnError: false,
        });
        await uploadProcess.done();
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }
}
