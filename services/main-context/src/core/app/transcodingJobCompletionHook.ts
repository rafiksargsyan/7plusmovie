// This function is written in app layer, but it probably needs to be splitted
// between app and infra layer according to hexagonal architecture's port/adapter
// model. Basically we need infrastracture part that listens transcoding context
// event and calls application logic. We might also consider this with other handlers.

import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { Movie } from "../domain/aggregate/Movie";
import { TvShowRepositoryInterface } from "../ports/TvShowRepositoryInterface";
import { TvShowRepository } from "../../adapters/TvShowRepository";
import { MovieTranscodingJobRead } from "../domain/MovieTranscodingJob";
import { Audio, Release, Resolution, Subtitle, Video } from "../domain/entity/Release";
import { S3 } from '@aws-sdk/client-s3';
import { strIsBlank } from "../../utils";
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;
const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const dynamodbMovieTranscodingJobTableName = process.env.DYNAMODB_MOVIE_TRANSCODING_JOB_TABLE_NAME!;
const dynamodbTvShowTranscodingJobTableName = process.env.DYNAMODB_TV_SHOW_TRANSCODING_JOB_TABLE_NAME!;
const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;
const mediaAssetsS3Bucket = process.env.MEDIA_ASSETS_S3_BUCKET!;
const mediaAssetsR2Bucket = process.env.ClOUDFLARE_MEDIA_ASSETS_R2_BUCKET!;

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};
  
const translateConfig = { marshallOptions };
  
const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const tvShowRepo: TvShowRepositoryInterface = new TvShowRepository(docClient);

const secretsManager = new SecretsManager({});
const s3 = new S3({});

interface HandlerParam {
  transcodingContextJobId: string;
}

export const handler = async (event: HandlerParam): Promise<void> => {
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

  let scanParams = {
    TableName: dynamodbMovieTranscodingJobTableName,
    FilterExpression: '#transcodingContextJobId = :value',
    ExpressionAttributeNames: { '#transcodingContextJobId': 'transcodingContextJobId' },
    ExpressionAttributeValues: { ':value': event.transcodingContextJobId }
  } as const;
  let data = await docClient.scan(scanParams);
  if (data != undefined && data.Items != undefined && data.Items.length != 0) {
    let movieTranscodingJobRead = data.Items[0] as MovieTranscodingJobRead;
  
    const queryParams = {
      TableName: dynamodbMovieTableName,
      Key: { 'id':  movieTranscodingJobRead.movieId }
    } as const;
    let movieData = await docClient.get(queryParams);
    if (movieData == undefined || movieData.Item == undefined) {
      throw new FailedToGetMovieError();
    }
    let movie = new Movie(true);
    Object.assign(movie, movieData.Item);

    const subtitles = {};
    movieTranscodingJobRead.textTranscodeSpecs.forEach(_ => subtitles[_.name!] =
      Subtitle.create(_.name!, `${movieTranscodingJobRead.outputFolderKey}/subtitles/${_.fileName}`, _.lang, _.type));
    const audios = {};
    movieTranscodingJobRead.audioTranscodeSpecs.forEach(_ => audios[_.name!] =
      Audio.create(_.name!, `${movieTranscodingJobRead.outputFolderKey}/vod/${_.fileName}`, _.lang, _.channels))
    const resolutions: Resolution[] = [];
    for (let r of movieTranscodingJobRead.videoTranscodeSpec.resolutions) {
      const relativePath = `${movieTranscodingJobRead.outputFolderKey}/vod/${r.fileName}`;
      const size = await getS3ObjectSize(mediaAssetsS3Bucket, relativePath);
      resolutions.push({ resolution: r.resolution, relativePath: relativePath, size: size })
    }
    const video = Video.create(resolutions);

    movie.addRelease(movieTranscodingJobRead.releaseId, Release.create(subtitles, audios, video,
      `${movieTranscodingJobRead.outputFolderKey}/vod/manifest.mpd`,
      `${movieTranscodingJobRead.outputFolderKey}/vod/master.m3u8`,
      `${movieTranscodingJobRead.outputFolderKey}/thumbnails/thumbnails.vtt`,
      movieTranscodingJobRead.releaseIndexerContextReleaseId, movieTranscodingJobRead.outputFolderKey));
    
    const rootFolders: string[] = [];
    movieTranscodingJobRead.releasesToBeRemoved.forEach(k => {
      const rootFolder = movie.getRelease(k)?.rootFolder;
      if (!strIsBlank(rootFolder)) {
        rootFolders.push(rootFolder!);
      }
    });  
    movieTranscodingJobRead.releasesToBeRemoved.forEach(r => movie.removeRelease(r));

    await docClient.put({ TableName: dynamodbMovieTableName, Item: movie });

    for (let rf of rootFolders) {
      try {
        await emptyS3Directory(s3, mediaAssetsS3Bucket, rf);
        await emptyS3Directory(r2, mediaAssetsR2Bucket, rf);
      } catch (e) {
        console.error(e);
      }
    }

    return;
  }
  
  // scanParams = {
  //   TableName: dynamodbTvShowTranscodingJobTableName,
  //   FilterExpression: '#transcodingContextJobId = :value',
  //   ExpressionAttributeNames: { '#transcodingContextJobId': 'transcodingContextJobId' },
  //   ExpressionAttributeValues: { ':value': event.transcodingContextJobId }
  // } as const;
  // data = await docClient.scan(scanParams);
  // if (data != undefined && data.Items != undefined && data.Items.length != 0) {
  //   let tvShowTranscodingJobRead: TvShowTranscodingJobRead = {};
  //   Object.assign(tvShowTranscodingJobRead, data.Items[0]);

  //   let tvShow = await tvShowRepo.getTvShowById(tvShowTranscodingJobRead.tvShowId);

  //   const season = tvShowTranscodingJobRead.season;
  //   const episode = tvShowTranscodingJobRead.episode;
  //   // This is not right way to update tvShow model as there might be extra application logic for validation, etc.
  //   // Right way would be calling corresponding lambda to the job and avoid app logic duplication. 
  //   tvShow.addMpdFile(season, episode, `${tvShowTranscodingJobRead.outputFolderKey}/vod/manifest.mpd`);
  //   tvShow.addM3u8File(season, episode, `${tvShowTranscodingJobRead.outputFolderKey}/vod/master.m3u8`);
  //   tvShowTranscodingJobRead.textTranscodeSpecs?.forEach(_ => {
  //     const relativePath = `${tvShowTranscodingJobRead.outputFolderKey}/subtitles/${SubsLangCodes[_.lang.code]['langTag']}-${_.type.code}-${_.stream}.vtt`;
  //     tvShow.addSubtitle(season, episode, _.name, new Subtitle(_.name, relativePath, _.lang, _.type));
  //   })
  //   tvShow.addThumbnailsFile(season, episode, `${tvShowTranscodingJobRead.outputFolderKey}/thumbnails/thumbnails.vtt`);
  //   await tvShowRepo.saveTvShow(tvShow);
  //   return;
  // }
  
  throw new FailedToGetMovieOrTvShowTranscodingJobError();
};

class FailedToGetMovieOrTvShowTranscodingJobError extends Error {};

class FailedToGetMovieError extends Error {};

const getS3ObjectSize = async (bucketName: string, path: string): Promise<number | undefined> => {
  let objectData;
  try {
    objectData = await s3.headObject({
      Bucket: bucketName,
      Key: path
    })
  } catch (e) {
    console.error(e);
    return;
  }
  return objectData.ContentLength;
}

async function emptyS3Directory(s3: S3, bucket, dir) {
  if (strIsBlank(dir)) return;

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
