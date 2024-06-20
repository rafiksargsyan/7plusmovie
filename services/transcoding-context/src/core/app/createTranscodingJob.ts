import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TranscodingJob } from "../domain/TranscodingJob";
import { Lang } from '../domain/Lang';

const dynamodbTranscodingJobTableName = process.env.DYNAMODB_TRANSCODING_JOB_TABLE_NAME!;

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
  fileName: string;
  name: string;
}

interface TextTranscodeSpecParam {
  stream: number;
  fileName: string;
  lang: string;
  name: string;
}

interface VideoTranscodeSpec {
  resolutions: { fileName: string, resolution: number } []; // 360, 480, 720, 1080, etc.
  stream: number;
}

interface CreateTranscodingJobParam {
  mkvS3ObjectKey: string;
  mkvHttpUrl: string;
  outputFolderKey: string;
  audioTranscodeSpecParams: AudioTranscodeSpecParam[] | undefined;
  textTranscodeSpecParams: TextTranscodeSpecParam[] | undefined;
  videoTranscodeSpec: VideoTranscodeSpec
}

export const handler = async (event: CreateTranscodingJobParam): Promise<string> => {
  let audioTranscodeSpecParams = event.audioTranscodeSpecParams?.map(_ => {
    return { stream: _.stream, bitrate: _.bitrate, channels: _.channels, lang: Lang.fromKeyOrThrow(_.lang), name: _.name, fileName: _.name }
  });
  let textTranscodeSpecParams = event.textTranscodeSpecParams?.map(_ => {
    return { stream: _.stream, fileName: _.fileName, lang: Lang.fromKeyOrThrow(_.lang), name: _.name }
  });
  let transcodingJob = new TranscodingJob(false, event.mkvS3ObjectKey, event.mkvHttpUrl, event.outputFolderKey,
    audioTranscodeSpecParams, textTranscodeSpecParams, event.videoTranscodeSpec);
  
  await docClient.put({TableName: dynamodbTranscodingJobTableName, Item: transcodingJob});

  return transcodingJob.id;
};
