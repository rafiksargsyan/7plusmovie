import { S3Event } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { v2 as cloudinary } from 'cloudinary';

const s3 = new S3();

cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET });

export const handler = async (event: S3Event): Promise<void> => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  const params = { Bucket: bucket, Key: key } as const;
  const { ContentType } = await s3.headObject(params).promise();
  if (ContentType != undefined && ContentType.startsWith('image')) {
    const url = s3.getSignedUrl('getObject', params);
    const folder = key.substring(0, key.lastIndexOf("/")+1);
    const uploadOptions = { use_filename: true, unique_filename: false, folder: folder };
    await cloudinary.uploader.upload(url, uploadOptions);
  }
};
