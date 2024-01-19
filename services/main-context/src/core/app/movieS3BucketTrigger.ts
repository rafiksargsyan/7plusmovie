import { S3Event } from 'aws-lambda';
import { S3, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;
const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

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
  
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  const params = { Bucket: bucket, Key: key } as const; 
  const { ContentType } = await s3.headObject(params);
  if (ContentType != undefined && ContentType.startsWith('image') && !key.includes('sprite-')) {
    const command = new GetObjectCommand(params);
    const response = await s3.send(command);
    const object = response.Body;
    const length = response.ContentLength;
    const contentType = response.ContentType;
    const putCommand = new PutObjectCommand({ Bucket: process.env.ClOUDFLARE_MEDIA_ASSETS_R2_BUCKET, Key: key, Body: object,
      ContentLength: length, ContentType: contentType || 'image/jpeg' });
    await r2.send(putCommand);
  }
};
