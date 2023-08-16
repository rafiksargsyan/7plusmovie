import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDBStreamEvent } from 'aws-lambda';
import { MovieTranscodingJob } from '../domain/MovieTranscodingJob';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { SubsLangCode } from '../domain/SubsLangCodes';
import { AudioLangCode } from '../domain/AudioLangCodes';

const transcodingContextJobCreationLambdaName = process.env.TRANSCODING_CONTEXT_JOB_CREATION_LAMBDA_NAME!;
const dynamodbMovieTranscodingJobTableName = process.env.DYNAMODB_MOVIE_TRANSCODING_JOB_TABLE_NAME!;

const marshaller = new Marshaller();
const lambdaClient = new LambdaClient({});

const marshallOptions = {
  convertClassInstanceToMap: true
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
  
interface MovieTranscodingJobRead {
  id?: string;
  movieId?: string;
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
        let movieTranscodingJobRead: MovieTranscodingJobRead = item;
        if (movieTranscodingJobRead.transcodingContextJobId == undefined) {
          const queryParams = {
            TableName: dynamodbMovieTranscodingJobTableName,
            Key: { 'id': movieTranscodingJobRead.id }
          }  as const;
          let data = await docClient.get(queryParams);
          if (data == undefined || data.Item == undefined) {
            throw new FailedToGetMovieTranscodingJobError();
          }
          let movieTranscodingJob = new MovieTranscodingJob(true);
          Object.assign(movieTranscodingJob, data.Item);

          const transcodingJobParams = {
            mkvS3ObjectKey: movieTranscodingJobRead.mkvS3ObjectKey,
            outputFolderKey: movieTranscodingJobRead.outputFolderKey,
            audioTranscodeSpecParams: movieTranscodingJobRead.audioTranscodeSpecs?.map(_ => ({ ..._, lang: _.lang.code })),
            textTranscodeSpecParams: movieTranscodingJobRead.textTranscodeSpecs?.map(_ => ({ ..._, lang: _.lang.code })),
            defaultAudioTrack: movieTranscodingJobRead.defaultAudioTrack,
            defaultTextTrack: movieTranscodingJobRead.defaultTextTrack
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
          movieTranscodingJob.setTranscodingContextJobId(payloadStr.substring(1, payloadStr.length - 1));
          await docClient.put({TableName: dynamodbMovieTranscodingJobTableName, Item: movieTranscodingJob});
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
}

class TranscodingContextResponseEmptyPayloadError extends Error {};

class FailedToGetMovieTranscodingJobError extends Error {};
