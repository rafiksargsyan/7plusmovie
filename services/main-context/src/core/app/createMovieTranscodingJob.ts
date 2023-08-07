import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { MovieTranscodingJob } from "../domain/MovieTranscodingJob";
import { AudioLangCode } from "../domain/AudioLangCodes";
import { SubsLangCode } from "../domain/SubsLangCodes";

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TRANSCODING_JOB_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true
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
  forced: boolean;
  lang: string;
}

interface CreateMovieTranscodingJobParam {
  movieId: string;
  mkvS3ObjectKey: string;
  outputFolderKey: string;
  audioTranscodeSpecParams: AudioTranscodeSpecParam[];
  textTranscodeSpecParams: TextTranscodeSpecParam[];
  defaultAudioTrack: number | undefined;
  defaultTextTrack: number | undefined;
}

export const handler = async (event: CreateMovieTranscodingJobParam): Promise<string> => {
  let audioTranscodeSpecParams = event.audioTranscodeSpecParams == undefined ? []
  : event.audioTranscodeSpecParams.map(_ => {
    return { stream: _.stream, bitrate: _.bitrate, channels: _.channels, lang: new AudioLangCode(_.lang) }
  });
  let textTranscodeSpecParams = event.textTranscodeSpecParams == undefined ? []
  : event.textTranscodeSpecParams.map(_ => {
    return { stream: _.stream, forced: _.forced, lang: new SubsLangCode(_.lang)}
  });
  let movieTranscodingJob = new MovieTranscodingJob(false, event.movieId, event.mkvS3ObjectKey, event.outputFolderKey,
    audioTranscodeSpecParams, textTranscodeSpecParams, event.defaultAudioTrack, event.defaultTextTrack);
  
  await docClient.put({TableName: dynamodbMovieTableName, Item: movieTranscodingJob});

  return movieTranscodingJob.id;
};
