import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TvShowRepository } from '../../adapters/TvShowRepository';
import { InvocationType, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

const tvShowRCUpdaterFanoutSeasonsLambdaName = process.env.TVSHOW_RC_UPDATER_FANOUT_SEASONS_LAMBDA_NAME;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const tvShowRepo = new TvShowRepository(docClient);
const lambdaClient = new LambdaClient({});

export const handler = async (): Promise<void> => {
  const tvShows = await tvShowRepo.getAllLazy();
  for (const t of tvShows) {
    const fanoutSeasonParams = {
      tvShowId: t.id
    }
    const lambdaParams = {
      FunctionName: tvShowRCUpdaterFanoutSeasonsLambdaName,
      InvocationType: InvocationType.Event,
      Payload: JSON.stringify(fanoutSeasonParams)
    };
    const invokeCommand = new InvokeCommand(lambdaParams);
    try {
      await lambdaClient.send(invokeCommand);
    } catch (e) {
      console.log(e);
    }
  }
};