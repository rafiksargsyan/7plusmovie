import { Movie } from "../domain/aggregate/Movie";
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { strIsBlank } from "../../utils";
import { S3 } from '@aws-sdk/client-s3';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { ReleaseRead } from "../domain/entity/Release";

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;
const mediaAssetsR2Bucket = process.env.ClOUDFLARE_MEDIA_ASSETS_R2_BUCKET!;
const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;
const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const secretsManager = new SecretsManager({});
const s3 = new S3({});

interface Param {
  movieId: string;
  releaseId: string;
}

export const handler = async (event: Param): Promise<void> => {
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);
  
  const r2 = new S3({
    region: "auto",
    endpoint: `https://${cloudflareAccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: secret.R2_ACCESS_KEY_ID,
      secretAccessKey: secret.R2_SECRET_ACCESS_KEY,
    },
  });

  const queryParams = {
    TableName: dynamodbMovieTableName,
    Key: { 'id': event.movieId }
  } as const;
  let data = await docClient.get(queryParams);
  if (data === undefined || data.Item === undefined) {
    throw new FailedToGetMovieError();
  }
  let movie = new Movie(true);
  Object.assign(movie, data.Item);
  const release: ReleaseRead = movie.getRelease(event.releaseId) as unknown as ReleaseRead;
  movie.removeRelease(event.releaseId);
  await docClient.put({ TableName: dynamodbMovieTableName, Item: movie });

  if (event.releaseId === "migration") {
    const rootFolder = movie.id;
    try {
      await emptyS3Directory(r2, mediaAssetsR2Bucket, `${rootFolder}/vod`);
      await emptyS3Directory(r2, mediaAssetsR2Bucket, `${rootFolder}/thumbnails`);
      await emptyS3Directory(r2, mediaAssetsR2Bucket, `${rootFolder}/subtitles`);
    } catch (e) {
      console.error(e);
    }
  } else {
    try {
      await emptyS3Directory(r2, mediaAssetsR2Bucket, release._rootFolder);
    } catch (e) {
      console.error(e);
    }
  }
};

async function emptyS3Directory(s3: S3, bucket, dir: string) {
    if (strIsBlank(dir)) return;
    if (!dir.endsWith('/')) dir = `${dir}/`
 
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
  
    if (listedObjects.IsTruncated) await emptyS3Directory(s3, bucket, dir);
  }

class FailedToGetMovieError extends Error {}
