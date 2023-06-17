import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDBStreamEvent } from 'aws-lambda';
import algoliasearch from 'algoliasearch';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { v2 as cloudinary } from 'cloudinary';
import { S3 } from '@aws-sdk/client-s3';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const secretsManager = new SecretsManager({});
const s3 = new S3({});

const marshaller = new Marshaller();

interface Movie {
  id: string;
  originalTitle: string;
  posterImagesPortrait: { [key: string]: string };
  subtitles: { [key: string]: string };
  releaseYear: number;
  titleL8ns: { [key: string]: string };
  creationTime: number;
  mpdFile: string;
  m3u8File: string;
}

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);
  const algoliaClient = algoliasearch(process.env.ALGOLIA_APP_ID!, secret.ALGOLIA_ADMIN_KEY!);
  const algoliaIndex = algoliaClient.initIndex(process.env.ALGOLIA_ALL_INDEX!);
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                      api_key: process.env.CLOUDINARY_API_KEY,
                      api_secret: secret.CLOUDINARY_API_SECRET });

  for (const record of event.Records) {
    if (record.eventName === 'REMOVE') {
      let objectID = record.dynamodb?.Keys?.id.S;
      await algoliaIndex.deleteBy({filters: `objectID: ${objectID}`});
      await cloudinary.api.delete_resources_by_prefix(objectID!);
      await emptyS3Directory(process.env.MEDIA_ASSETS_S3_BUCKET, `${objectID}/`);
    } else {
      let movie: Movie = marshaller.unmarshallItem(record.dynamodb?.NewImage!) as unknown as Movie;
      if (movie.mpdFile == null || movie.m3u8File == null
        || Object.keys(movie.posterImagesPortrait).length === 0) {
        return;
      }
      await algoliaIndex.saveObject({ objectID: movie.id,
                                      creationTime: movie.creationTime,
                                      category: "MOVIE",
                                      originalTitle: movie.originalTitle,
                                      posterImagesPortrait: movie.posterImagesPortrait,
                                      titleL8ns: movie.titleL8ns,
                                      releaseYear: movie.releaseYear });
    }
  }
};

async function emptyS3Directory(bucket, dir) {
  const listParams = {
      Bucket: bucket,
      Prefix: dir
  };

  const listedObjects = await s3.listObjectsV2(listParams);

  if (listedObjects.Contents == undefined ||
    listedObjects.Contents.length === 0) return;

  const deleteParams = {
      Bucket: bucket,
      Delete: { Objects: [] }
  };

  listedObjects.Contents.forEach(({ Key }) => {
      deleteParams.Delete.Objects.push({ Key } as never);
  });

  await s3.deleteObjects(deleteParams);

  if (listedObjects.IsTruncated) await emptyS3Directory(bucket, dir);
}
