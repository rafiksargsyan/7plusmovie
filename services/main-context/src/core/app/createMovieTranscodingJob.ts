import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { MovieTranscodingJob } from "../domain/MovieTranscodingJob";
import { AudioLangCode } from "../domain/AudioLangCodes";
import { SubsLangCode, SubsLangCodes } from "../domain/SubsLangCodes";
import { SubtitleType, SubtitleTypes } from '../domain/SubtitleType';

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
}

interface TextTranscodeSpecParam {
  stream: number;
  name: string;
  lang: string;
  type: string;
}

interface CreateMovieTranscodingJobParam {
  movieId: string;
  mkvS3ObjectKey: string;
  mkvHttpUrl: string;
  outputFolderKey: string;
  audioTranscodeSpecParams: AudioTranscodeSpecParam[] | undefined;
  textTranscodeSpecParams: TextTranscodeSpecParam[] | undefined;
  defaultAudioTrack: number | undefined;
  defaultTextTrack: number | undefined;
}

export const handler = async (event: CreateMovieTranscodingJobParam): Promise<string> => {
  let audioTranscodeSpecParams = event.audioTranscodeSpecParams?.map(_ => {
    return { stream: _.stream, bitrate: _.bitrate, channels: _.channels, lang: new AudioLangCode(_.lang) }
  });
  let textTranscodeSpecParams = event.textTranscodeSpecParams?.map(_ => {
    const name = _.name != null ? _.name : `${SubsLangCodes[_.lang].name} (${SubtitleTypes[_.type].name})`
    return { name: name, stream: _.stream, type: new SubtitleType(_.type), lang: new SubsLangCode(_.lang)}
  });
  let movieTranscodingJob = new MovieTranscodingJob(false, event.movieId, event.mkvS3ObjectKey, event.mkvHttpUrl, event.outputFolderKey,
    audioTranscodeSpecParams, textTranscodeSpecParams, event.defaultAudioTrack, event.defaultTextTrack);
  
  await docClient.put({TableName: dynamodbMovieTranscodingJobTableName, Item: movieTranscodingJob});docClient.batchWrite

  return movieTranscodingJob.id;
};
