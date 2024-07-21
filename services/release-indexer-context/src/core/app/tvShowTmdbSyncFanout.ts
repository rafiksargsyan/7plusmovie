import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { InvocationType, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { TvShowRepository } from '../../adapters/TvShowRepository';

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const tvShowRepo = new TvShowRepository(docClient)

const lambdaClient = new LambdaClient({});

const tvShowTmdbSyncLambdaName = process.env.TVSHOW_TMDB_SYNC_LAMBDA_NAME!;

export const handler = async (): Promise<void> => {
  const tvShows = await tvShowRepo.getAllLazy();
  for (const t of tvShows) {
    const params = {
      tvShowId: t.id
    }
    const lambdaParams = {
      FunctionName: tvShowTmdbSyncLambdaName,
      InvocationType: InvocationType.Event,
      Payload: JSON.stringify(params)
    };
    const invokeCommand = new InvokeCommand(lambdaParams);
    try {
      await lambdaClient.send(invokeCommand);
    } catch (e) {
      console.log(e);
    }
  }
}
