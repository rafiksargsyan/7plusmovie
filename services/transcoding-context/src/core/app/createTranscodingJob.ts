import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TranscodingJob } from "../domain/TranscodingJob";
import { AudioLangCode } from "../domain/AudioLangCodes";
import { SubsLangCode } from "../domain/SubsLangCodes";
import { SubtitleType } from '../domain/SubtitleType';

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
}

interface TextTranscodeSpecParam {
  stream: number;
  type: string;
  lang: string;
  name: string;
}

interface CreateTranscodingJobParam {
  mkvS3ObjectKey: string;
  mkvHttpUrl: string;
  outputFolderKey: string;
  audioTranscodeSpecParams: AudioTranscodeSpecParam[] | undefined;
  textTranscodeSpecParams: TextTranscodeSpecParam[] | undefined;
}

export const handler = async (event: CreateTranscodingJobParam): Promise<string> => {
  let audioTranscodeSpecParams = event.audioTranscodeSpecParams?.map(_ => {
    return { stream: _.stream, bitrate: _.bitrate, channels: _.channels, lang: new AudioLangCode(_.lang) }
  });
  let textTranscodeSpecParams = event.textTranscodeSpecParams?.map(_ => {
    return { stream: _.stream, type: new SubtitleType(_.type), lang: new SubsLangCode(_.lang), name: _.name }
  });
  let transcodingJob = new TranscodingJob(false, event.mkvS3ObjectKey, event.mkvHttpUrl, event.outputFolderKey,
    audioTranscodeSpecParams, textTranscodeSpecParams);
  
  await docClient.put({TableName: dynamodbTranscodingJobTableName, Item: transcodingJob});

  return transcodingJob.id;
};
