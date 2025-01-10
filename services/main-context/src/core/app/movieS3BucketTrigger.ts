import { S3Event } from 'aws-lambda';
import { S3, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;
const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const cloudflareCachableAccountId = process.env.CLOUDFLARE_CACHABLE_ACCOUNT_ID;

const secretsManager = new SecretsManager({});
const s3 = new S3({});

export const handler = async (event: S3Event): Promise<void> => {
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);

  const r2 = new S3({
    region: "auto",
    endpoint: `https://${cloudflareAccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: secret.R2_SECRET_ACCESS_KEY,
    },
  });

  const r2Cachable = new S3({
    region: "auto",
    endpoint: `https://${cloudflareCachableAccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: secret.R2_CACHABLE_ACCESS_KEY_ID,
      secretAccessKey: secret.R2_CACHABLE_SECRET_ACCESS_KEY,
    },
  });
  
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  const params = { Bucket: bucket, Key: key } as const; 
  const { ContentType } = await s3.headObject(params);
  if (ContentType != undefined && ContentType.startsWith('image') && !key.includes('sprite-')) {
    await copyFromS3BucketToR2(bucket, key, process.env.ClOUDFLARE_MEDIA_ASSETS_R2_BUCKET!, s3, r2);
    await copyFromS3BucketToR2(bucket, key, process.env.ClOUDFLARE_MEDIA_ASSETS_CACHABLE_R2_BUCKET!, s3, r2Cachable);
  }
};


async function copyFromS3BucketToR2(s3BucketName: string, s3ObjectKey: string, r2BucketName: string, s3Client: S3, r2Client: S3) {
  const params = { Bucket: s3BucketName, Key: s3ObjectKey } as const;
  const command = new GetObjectCommand(params);
  const response = await s3Client.send(command);
  const object = response.Body;
  const length = response.ContentLength;
  const contentType = response.ContentType;
  let putCommand = new PutObjectCommand({ Bucket: r2BucketName, Key: s3ObjectKey, Body: object,
    ContentLength: length, ContentType: contentType || 'image/jpeg' });
  await r2Client.send(putCommand);  
}