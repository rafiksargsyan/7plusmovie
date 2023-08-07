import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDBStreamEvent } from 'aws-lambda';
import algoliasearch from 'algoliasearch';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { v2 as cloudinary } from 'cloudinary';
import { S3 } from '@aws-sdk/client-s3';
import { MovieGenre, MovieGenres } from '../domain/MovieGenres';
import { Person, Persons } from '../domain/Persons';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { Movie } from "../domain/Movie";
import axios from 'axios';
import { L8nLangCode } from '../domain/L8nLangCodes';
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