import { S3Event } from 'aws-lambda';
import { S3, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { v2 as cloudinary } from 'cloudinary';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const secretsManager = new SecretsManager({});
const s3 = new S3({});

export const handler = async (event: S3Event): Promise<void> => {
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);

  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                      api_key: process.env.CLOUDINARY_API_KEY,
                      api_secret: secret.CLOUDINARY_API_SECRET });
  
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  const params = { Bucket: bucket, Key: key } as const;
  const { ContentType } = await s3.headObject(params);
  if (ContentType != undefined && ContentType.startsWith('image')) {
    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3, command);
    const folder = key.substring(0, key.lastIndexOf("/")+1);
    const uploadOptions = { use_filename: true, unique_filename: false, folder: folder };
    await cloudinary.uploader.upload(url, uploadOptions);
  }
};
