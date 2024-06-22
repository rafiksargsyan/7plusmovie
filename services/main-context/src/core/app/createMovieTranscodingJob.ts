import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { MovieTranscodingJob } from "../domain/MovieTranscodingJob";
import { Nullable } from '../../Nullable';
import { AudioLang } from '../domain/AudioLang';
import { SubtitleType } from '../domain/SubtitleType';
import { SubsLang } from '../domain/SubsLang';

const dynamodbMovieTranscodingJobTableName = process.env.DYNAMODB_MOVIE_TRANSCODING_JOB_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

interface AudioTranscodeSpecParam {
  stream: number;
  bitrate: string;
  channels: number;
  lang: string;
  fileName?: string;
  name?: string;
}

interface TextTranscodeSpecParam {
  stream: number;
  name?: string;
  lang: string;
  type: string;
  fileName?: string;
}

interface VideoTranscodeSpec {
  resolutions: { fileName: string, resolution: number } []; // 360, 480, 720, 1080, etc.
  stream: number;
}

interface CreateMovieTranscodingJobParam {
  movieId: string;
  mkvS3ObjectKey: string;
  mkvHttpUrl: string;
  outputFolderKey: string;
  audioTranscodeSpecParams: Nullable<AudioTranscodeSpecParam[]>;
  textTranscodeSpecParams: Nullable<TextTranscodeSpecParam[]>;
  videoTranscodeSpec: VideoTranscodeSpec;
  releaseId: string;
  releasesToBeRemoved: string[];
}

export const handler = async (event: CreateMovieTranscodingJobParam): Promise<string> => {
  const audioTranscodeSpecParams = event.audioTranscodeSpecParams?.map(_ => {
    return { stream: _.stream, bitrate: _.bitrate, channels: _.channels, lang: AudioLang.fromKeyOrThrow(_.lang), name: _.name, fileName: _.fileName }
  });
  const textTranscodeSpecParams = event.textTranscodeSpecParams?.map(_ => {
    return { name: _.name, fileName: _.fileName, stream: _.stream, type: SubtitleType.fromKeyOrThrow(_.type), lang: SubsLang.fromKeyOrThrow(_.lang) }
  });
  let movieTranscodingJob = new MovieTranscodingJob(false, event.movieId, event.mkvS3ObjectKey, event.mkvHttpUrl, event.outputFolderKey,
    audioTranscodeSpecParams, textTranscodeSpecParams, event.videoTranscodeSpec, event.releaseId, event.releasesToBeRemoved);
  
  await docClient.put({TableName: dynamodbMovieTranscodingJobTableName, Item: movieTranscodingJob});

  return movieTranscodingJob.id;
};
