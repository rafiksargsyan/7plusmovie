import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDBStreamEvent } from 'aws-lambda';
import { MovieTranscodingJob } from '../domain/MovieTranscodingJob';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

const transcodingContextJobCreationLambdaName = process.env.TRANSCODING_CONTEXT_JOB_CREATION_LAMBDA_NAME!;

const marshaller = new Marshaller();
const lambdaClient = new LambdaClient({});

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  for (const record of event.Records) {
    if (record.eventName === 'REMOVE') {
      // For now nothing to do in case of item removal
    } else {
      let movieTranscodingJob = new MovieTranscodingJob(true);  
      Object.assign(movieTranscodingJob, marshaller.unmarshallItem(record.dynamodb?.NewImage!));
      if (movieTranscodingJob.getTranscodingContextJobId() == undefined) {
        // Create transcoding job in transcoding context and get the id of the job
        const transcodingJobParams = {
          FunctionName: transcodingContextJobCreationLambdaName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({ key: 'value' }) // TODO:
        };
        const invokeCommand = new InvokeCommand(transcodingJobParams);
        const response = await lambdaClient.send(invokeCommand);
        console.log(JSON.stringify(response));
      }
    }
  }
}