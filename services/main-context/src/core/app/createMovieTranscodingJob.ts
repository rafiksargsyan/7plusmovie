import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { MovieTranscodingJob } from "../domain/MovieTranscodingJob";
import { AudioLang } from '../domain/AudioLang';
import { SubtitleType } from '../domain/SubtitleType';
import { SubsLang } from '../domain/SubsLang';
import { Nullable } from '../../utils';
import { Movie } from '../domain/aggregate/Movie';
import { RipType } from '../domain/RipType';
import { Resolution } from '../domain/Resolution';

const dynamodbMovieTranscodingJobTableName = process.env.DYNAMODB_MOVIE_TRANSCODING_JOB_TABLE_NAME!;
const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

export interface AudioTranscodeSpecParam {
  stream: number;
  bitrate: string;
  channels: number;
  lang: string;
  fileName?: string;
  name?: string;
}

export interface TextTranscodeSpecParam {
  stream: number;
  name?: string;
  lang: string;
  type?: string;
  fileName?: string;
}

export interface VideoTranscodeSpec {
  resolutions: { fileName?: string, resolution: number } []; // 360, 480, 720, 1080, etc.
  stream: number;
}

export interface CreateMovieTranscodingJobParam {
  movieId: string;
  mkvS3ObjectKey?: string;
  mkvHttpUrl?: string;
  outputFolderKey?: string;
  audioTranscodeSpecParams: Nullable<AudioTranscodeSpecParam[]>;
  textTranscodeSpecParams: Nullable<TextTranscodeSpecParam[]>;
  videoTranscodeSpec: VideoTranscodeSpec;
  releaseId: string;
  releasesToBeRemoved: string[];
  ripType: string;
  resolution: string;
  ricReleaseId: Nullable<string>;
  thumbnailResolutions: number[];
}

export const handler = async (event: CreateMovieTranscodingJobParam): Promise<string> => {
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

  const audioTranscodeSpecParams = event.audioTranscodeSpecParams?.map(_ => {
    return { stream: _.stream, bitrate: _.bitrate, channels: _.channels, lang: AudioLang.fromKeyOrThrow(_.lang), name: _.name, fileName: _.fileName }
  });
  const textTranscodeSpecParams = event.textTranscodeSpecParams?.map(_ => {
    return { name: _.name, fileName: _.fileName, stream: _.stream, type: SubtitleType.fromKey(_.type), lang: SubsLang.fromKeyOrThrow(_.lang) }
  });
  let movieTranscodingJob = new MovieTranscodingJob(false, event.movieId, event.mkvS3ObjectKey, event.mkvHttpUrl, event.outputFolderKey,
    audioTranscodeSpecParams, textTranscodeSpecParams, event.videoTranscodeSpec, event.releaseId, event.releasesToBeRemoved, RipType.fromKey(event.ripType),
    Resolution.fromKey(event.resolution), event.ricReleaseId, event.thumbnailResolutions);
  movie.transcodingStarted();

  const transactItems = [
    {
      Put: {
        TableName: dynamodbMovieTranscodingJobTableName,
        Item: movieTranscodingJob
      }
    },
    {
      Put: {
        TableName: dynamodbMovieTableName,
        Item: movie
      }
    }
  ]
  const params = {
    TransactItems: transactItems,
  };

  await docClient.transactWrite(params);

  return movieTranscodingJob.id;
};

export class FailedToGetMovieError extends Error {}
