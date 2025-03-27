import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl as getSignedUrlCommand } from '@aws-sdk/s3-request-presigner';

const Bucket = process.env.B2_BUCKET_NAME;

export async function getClientFromAWSSDK() {
  // Configure the S3 client
  const s3Client = new S3Client({
    endpoint: `${process.env.B2_ENDPOINT}`,
    region: process.env.B2_REGION || 'auto',
    credentials: {
      accessKeyId: process.env.B2_APPLICATION_KEY_ID,
      secretAccessKey: process.env.B2_APPLICATION_KEY,
    },
  });

  return s3Client;
}

export async function getSignedUrl(
  s3Client: S3Client,
  Key: string,
  ContentType: string
) {
  // Set up the command parameters
  const command = new PutObjectCommand({
    Bucket,
    Key,
    ContentType,
  });

  // Generate the presigned URL (expires in 3600 seconds / 1 hour by default)
  const signedUrl = await getSignedUrlCommand(s3Client, command, {
    expiresIn: 3600,
  });
  return signedUrl;
}

export async function getSignedUrlforDownload(s3Client: S3Client, Key: string) {
  // Set up the command parameters
  const command = new GetObjectCommand({
    Bucket,
    Key,
  });

  // Generate the presigned URL (expires in 3600 seconds / 1 hour by default)
  const signedUrl = await getSignedUrlCommand(s3Client, command, {
    expiresIn: 3600,
  });
  return signedUrl;
}
