import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { MovieRepository } from '../../adapters/MovieRepository';
import { InvocationType, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const movieRepo = new MovieRepository(docClient);
const lambdaClient = new LambdaClient({});

const fantomAssetsCleanupLambdaName = process.env.FANTOM_ASSETS_CLEANUP_LAMBDA_NAME!;

export const handler = async (): Promise<void> => {
  const movies = await movieRepo.getAllMovies();
  for (const m of movies) {
    const cleanupLambdaParams = {
      movieId: m.id
    }
    const lambdaParams = {
      FunctionName: fantomAssetsCleanupLambdaName,
      InvocationType: InvocationType.Event,
      Payload: JSON.stringify(cleanupLambdaParams)
    };
    const invokeCommand = new InvokeCommand(lambdaParams);
    try {
      await lambdaClient.send(invokeCommand);
    } catch (e) {
      console.log(e);
    }
  }
}