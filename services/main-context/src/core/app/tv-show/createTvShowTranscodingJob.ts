import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TvShowTranscodingJob } from "../../domain/TvShowTranscodingJob";
import { AudioTranscodeSpecParam, TextTranscodeSpecParam, VideoTranscodeSpec } from '../createMovieTranscodingJob';
import { AudioLang } from '../../domain/AudioLang';
import { SubtitleType } from '../../domain/SubtitleType';
import { SubsLang } from '../../domain/SubsLang';
import { Nullable } from '../../../utils';

const dynamodbTvShowTranscodingJobTableName = process.env.DYNAMODB_TV_SHOW_TRANSCODING_JOB_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

interface CreateTvShowTranscodingJobParam {
  tvShowId: string;
  season: number;
  episode: number;
  mkvS3ObjectKey: string;
  mkvHttpUrl: string
  outputFolderKey: string;
  audioTranscodeSpecParams: Nullable<AudioTranscodeSpecParam[]>;
  textTranscodeSpecParams: Nullable<TextTranscodeSpecParam[]>;
  videoTranscodeSpec: VideoTranscodeSpec;
  releaseId: string;
  releasesToBeRemoved: string[];
}

export const handler = async (event: CreateTvShowTranscodingJobParam): Promise<string> => {
  const audioTranscodeSpecParams = event.audioTranscodeSpecParams?.map(_ => {
    return { stream: _.stream, bitrate: _.bitrate, channels: _.channels, lang: AudioLang.fromKeyOrThrow(_.lang), name: _.name, fileName: _.fileName }
  });
  const textTranscodeSpecParams = event.textTranscodeSpecParams?.map(_ => {
    return { name: _.name, fileName: _.fileName, stream: _.stream, type: SubtitleType.fromKeyOrThrow(_.type), lang: SubsLang.fromKeyOrThrow(_.lang) }
  });
  let tvShowTranscodingJob = new TvShowTranscodingJob(false, event.tvShowId, event.season, event.episode, event.mkvS3ObjectKey,
    event.mkvHttpUrl, event.outputFolderKey, audioTranscodeSpecParams, textTranscodeSpecParams, event.videoTranscodeSpec, event.releaseId, event.releasesToBeRemoved);
  
  await docClient.put({TableName: dynamodbTvShowTranscodingJobTableName, Item: tvShowTranscodingJob});

  return tvShowTranscodingJob.id;
};
