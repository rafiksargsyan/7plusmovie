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
import { Audio, AudioRead, Release, ReleaseRead, Resolution, Subtitle, Thumbnail, Video } from "../domain/entity/Release";
import { S3 } from '@aws-sdk/client-s3';
import { strIsBlank } from "../../utils";
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { TvShowTranscodingJobRead } from "../domain/TvShowTranscodingJob";
import { AudioLang } from "../domain/AudioLang";

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

    const thumbnails: Thumbnail[] = movieTranscodingJobRead.thumbnailResolutions
    .map(r => ({ resolution: r, thumbnailsFile: `${movieTranscodingJobRead.outputFolderKey}/thumbnails/${r}/thumbnails.vtt`}));
    movie.addRelease(movieTranscodingJobRead.releaseId, Release.create(subtitles, audios, video,
      `${movieTranscodingJobRead.outputFolderKey}/vod/manifest.mpd`,
      `${movieTranscodingJobRead.outputFolderKey}/vod/master.m3u8`,
      movieTranscodingJobRead.releaseIndexerContextReleaseId, movieTranscodingJobRead.outputFolderKey,
      movieTranscodingJobRead.ripType, movieTranscodingJobRead.resolution, thumbnails));
    
    const rootFolders: string[] = [];
    movieTranscodingJobRead.releasesToBeRemoved.forEach(k => {
      const rootFolder = (movie.getRelease(k) as { _rootFolder: string } | null)?._rootFolder;
      if (!strIsBlank(rootFolder)) {
        rootFolders.push(rootFolder!);
      }
    });  
    movieTranscodingJobRead.releasesToBeRemoved.forEach(r => movie.removeRelease(r));
    movie.transcodingFinished();

    const migrationRelease = movie.getRelease("migration");
    let removeMigrationRelease = false;
    if (migrationRelease != null) {
      removeMigrationRelease = checkReleaseAudios(migrationRelease, Object.values(audios));
      if (removeMigrationRelease) {
        movie.removeRelease("migration");
      }
    } 

    await docClient.put({ TableName: dynamodbMovieTableName, Item: movie });

    for (let rf of rootFolders) {
      try {
        await emptyS3Directory(s3, mediaAssetsS3Bucket, rf);
        await emptyS3Directory(r2, mediaAssetsR2Bucket, rf);
      } catch (e) {
        console.error(e);
      }
    }

    if (removeMigrationRelease) {
      const rootFolder = `${movie.id}`;
      try {
        await emptyS3Directory(s3, mediaAssetsS3Bucket, `${rootFolder}/vod`);
        await emptyS3Directory(s3, mediaAssetsS3Bucket, `${rootFolder}/thumbnails`);
        await emptyS3Directory(s3, mediaAssetsS3Bucket, `${rootFolder}/subtitles`);
        await emptyS3Directory(r2, mediaAssetsR2Bucket, `${rootFolder}/vod`);
        await emptyS3Directory(r2, mediaAssetsR2Bucket, `${rootFolder}/thumbnails`);
        await emptyS3Directory(r2, mediaAssetsR2Bucket, `${rootFolder}/subtitles`);
      } catch (e) {
        console.error(e);
      }
    }

    return;
  }
  
  scanParams = {
    TableName: dynamodbTvShowTranscodingJobTableName,
    FilterExpression: '#transcodingContextJobId = :value',
    ExpressionAttributeNames: { '#transcodingContextJobId': 'transcodingContextJobId' },
    ExpressionAttributeValues: { ':value': event.transcodingContextJobId }
  } as const;
  data = await docClient.scan(scanParams);
  if (data != undefined && data.Items != undefined && data.Items.length != 0) {
    let tvShowTranscodingJobRead = data.Items[0] as TvShowTranscodingJobRead;
    Object.assign(tvShowTranscodingJobRead, data.Items[0]);

    let tvShow = await tvShowRepo.getTvShowById(tvShowTranscodingJobRead.tvShowId);

    const season = tvShowTranscodingJobRead.season;
    const episode = tvShowTranscodingJobRead.episode;
    // This is not right way to update tvShow model as there might be extra application logic for validation, etc.
    // Right way would be calling corresponding lambda to the job and avoid app logic duplication. 
    
    const subtitles = {};
    tvShowTranscodingJobRead.textTranscodeSpecs.forEach(_ => subtitles[_.name!] =
      Subtitle.create(_.name!, `${tvShowTranscodingJobRead.outputFolderKey}/subtitles/${_.fileName}`, _.lang, _.type));
    const audios = {};
    tvShowTranscodingJobRead.audioTranscodeSpecs.forEach(_ => audios[_.name!] =
      Audio.create(_.name!, `${tvShowTranscodingJobRead.outputFolderKey}/vod/${_.fileName}`, _.lang, _.channels))
    const resolutions: Resolution[] = [];
    for (let r of tvShowTranscodingJobRead.videoTranscodeSpec.resolutions) {
      const relativePath = `${tvShowTranscodingJobRead.outputFolderKey}/vod/${r.fileName}`;
      const size = await getS3ObjectSize(mediaAssetsS3Bucket, relativePath);
      resolutions.push({ resolution: r.resolution, relativePath: relativePath, size: size })
    }
    const video = Video.create(resolutions);

    const thumbnails: Thumbnail[] = tvShowTranscodingJobRead.thumbnailResolutions
    .map(r => ({ resolution: r, thumbnailsFile: `${tvShowTranscodingJobRead.outputFolderKey}/thumbnails/${r}/thumbnails.vtt`}))
    tvShow.addRelease(season, episode, tvShowTranscodingJobRead.releaseId, Release.create(subtitles, audios, video,
      `${tvShowTranscodingJobRead.outputFolderKey}/vod/manifest.mpd`,
      `${tvShowTranscodingJobRead.outputFolderKey}/vod/master.m3u8`,
      tvShowTranscodingJobRead.releaseIndexerContextReleaseId, tvShowTranscodingJobRead.outputFolderKey,
      tvShowTranscodingJobRead.ripType, tvShowTranscodingJobRead.resolution, thumbnails));
    
    const rootFolders: string[] = [];
    tvShowTranscodingJobRead.releasesToBeRemoved.forEach(k => {
      const rootFolder = (tvShow.getRelease(season, episode, k) as { _rootFolder: string } | null)?._rootFolder;
      if (!strIsBlank(rootFolder)) {
        rootFolders.push(rootFolder!);
      }
    });  
    tvShowTranscodingJobRead.releasesToBeRemoved.forEach(k => tvShow.removeRelease(season, episode, k));

    const migrationRelease = tvShow.getRelease(season, episode, "migration");
    let removeMigrationRelease = false;
    if (migrationRelease != null) {
      removeMigrationRelease = checkReleaseAudios(migrationRelease, Object.values(audios));
      if (removeMigrationRelease) {
        tvShow.removeRelease(season, episode, "migration");
      }
    } 

    await tvShowRepo.saveTvShow(tvShow);

    for (let rf of rootFolders) {
      try {
        await emptyS3Directory(s3, mediaAssetsS3Bucket, rf);
        await emptyS3Directory(r2, mediaAssetsR2Bucket, rf);
      } catch (e) {
        console.error(e);
      }
    }
    
    if (removeMigrationRelease) {
      const rootFolder = `${tvShow.id}/${season}/${episode}`;
      try {
        await emptyS3Directory(s3, mediaAssetsS3Bucket, `${rootFolder}/vod`);
        await emptyS3Directory(s3, mediaAssetsS3Bucket, `${rootFolder}/thumbnails`);
        await emptyS3Directory(s3, mediaAssetsS3Bucket, `${rootFolder}/subtitles`);
        await emptyS3Directory(r2, mediaAssetsR2Bucket, `${rootFolder}/vod`);
        await emptyS3Directory(r2, mediaAssetsR2Bucket, `${rootFolder}/thumbnails`);
        await emptyS3Directory(r2, mediaAssetsR2Bucket, `${rootFolder}/subtitles`);
      } catch (e) {
        console.error(e);
      }
    }

    return;
  }
  
  throw new FailedToGetMovieOrTvShowTranscodingJobError();
};

class FailedToGetMovieOrTvShowTranscodingJobError extends Error {};

class FailedToGetMovieError extends Error {};

function checkReleaseAudios(r: Release, audios: Audio[]) {
  const rAudios = (r as unknown as ReleaseRead)._audios;
  for (const k in rAudios) {
    const ra = rAudios[k];
    let audioExists = false;
    for (const a of audios) {
      if (AudioLang.looseEquals(ra.lang, (a as unknown as AudioRead).lang)) {
        audioExists = true;
        break;
      }
    }
    if (!audioExists) return false;
  }
  return true;
}

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
