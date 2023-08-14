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
  movieId?: string;
  textTranscodeSpecs?: TextTranscodeSpec[];
  audioTranscodeSpecs?: AudioTranscodeSpec[];
  mkvS3ObjectKey?: string;
  outputFolderKey?: string;
  defaultAudioTrack?: number | undefined;
  defaultTextTrack?: number | undefined;
}

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  for (const record of event.Records) {
    if (record.eventName === 'REMOVE') {
      // For now nothing to do in case of item removal
    } else {
      let movieTranscodingJob = new MovieTranscodingJob(true);
      let item = marshaller.unmarshallItem(record.dynamodb?.NewImage!);
      Object.assign(movieTranscodingJob, item);
      let movieTranscodingJobRead: MovieTranscodingJobRead = item;
      if (movieTranscodingJob.getTranscodingContextJobId() == undefined) {
        // Create transcoding job in transcoding context and get the id of the job
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
        console.log(JSON.stringify(response));
        if (response.Payload?.toString() === undefined) {
            throw new FailedToCreateTranscodingJobError();
        }
        movieTranscodingJob.setTranscodingContextJobId(response.Payload?.toString());
        await docClient.put({TableName: dynamodbMovieTranscodingJobTableName, Item: movieTranscodingJob});
      }
    }
  }
}

class FailedToCreateTranscodingJobError extends Error {};
