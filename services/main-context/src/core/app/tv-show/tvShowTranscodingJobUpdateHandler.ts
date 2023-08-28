import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDBStreamEvent } from 'aws-lambda';
import { TvShowTranscodingJob } from '../../domain/TvShowTranscodingJob';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { SubsLangCode } from '../../domain/SubsLangCodes';
import { AudioLangCode } from '../../domain/AudioLangCodes';

const transcodingContextJobCreationLambdaName = process.env.TRANSCODING_CONTEXT_JOB_CREATION_LAMBDA_NAME!;
const dynamodbTvShowTranscodingJobTableName = process.env.DYNAMODB_TV_SHOW_TRANSCODING_JOB_TABLE_NAME!;

const marshaller = new Marshaller();
const lambdaClient = new LambdaClient({});

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};
    
const translateConfig = { marshallOptions };
    
const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

interface AudioTranscodeSpec {
  stream: number;
  bitrate: string;
  channels: number;
  lang: AudioLangCode;
}

interface TextTranscodeSpec {
  stream: number;
  forced: boolean;
  lang: SubsLangCode;
}
  
interface TvShowTranscodingJobRead {
  id?: string;
  tvShowId?: string;
  season?: number;
  episode?: number;
  textTranscodeSpecs?: TextTranscodeSpec[];
  audioTranscodeSpecs?: AudioTranscodeSpec[];
  mkvS3ObjectKey?: string;
  outputFolderKey?: string;
  defaultAudioTrack?: number | undefined;
  defaultTextTrack?: number | undefined;
  transcodingContextJobId?: string | undefined;
}

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  try {
    for (const record of event.Records) {
      if (record.eventName === 'REMOVE') {
        // For now nothing to do in case of item removal
      } else {
        let item = marshaller.unmarshallItem(record.dynamodb?.NewImage!);
        let tvShowTranscodingJobRead: TvShowTranscodingJobRead = item;
        if (tvShowTranscodingJobRead.transcodingContextJobId == undefined) {
          const queryParams = {
            TableName: dynamodbTvShowTranscodingJobTableName,
            Key: { 'id': tvShowTranscodingJobRead.id }
          }  as const;
          let data = await docClient.get(queryParams);
          if (data == undefined || data.Item == undefined) {
            throw new FailedToGetTvShowTranscodingJobError();
          }
          let tvShowTranscodingJob = new TvShowTranscodingJob(true);
          Object.assign(tvShowTranscodingJob, data.Item);

          const transcodingJobParams = {
            mkvS3ObjectKey: tvShowTranscodingJobRead.mkvS3ObjectKey,
            outputFolderKey: tvShowTranscodingJobRead.outputFolderKey,
            audioTranscodeSpecParams: tvShowTranscodingJobRead.audioTranscodeSpecs?.map(_ => ({ ..._, lang: _.lang.code })),
            textTranscodeSpecParams: tvShowTranscodingJobRead.textTranscodeSpecs?.map(_ => ({ ..._, lang: _.lang.code })),
            defaultAudioTrack: tvShowTranscodingJobRead.defaultAudioTrack,
            defaultTextTrack: tvShowTranscodingJobRead.defaultTextTrack
          }
          const lambdaParams = {
            FunctionName: transcodingContextJobCreationLambdaName,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(transcodingJobParams)
          };
          const invokeCommand = new InvokeCommand(lambdaParams);
          const response = await lambdaClient.send(invokeCommand);
          if (response.Payload == undefined) {
            throw new TranscodingContextResponseEmptyPayloadError();
          }
          const payloadStr = Buffer.from(response.Payload).toString();
          tvShowTranscodingJob.setTranscodingContextJobId(payloadStr.substring(1, payloadStr.length - 1));
          await docClient.put({TableName: dynamodbTvShowTranscodingJobTableName, Item: tvShowTranscodingJob});
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
}

class TranscodingContextResponseEmptyPayloadError extends Error {};

class FailedToGetTvShowTranscodingJobError extends Error {};
