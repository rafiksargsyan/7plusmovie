import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TvShowRepository } from '../../adapters/TvShowRepository';
import { InvocationType, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

const tvShowRCUpdaterLambdaName = process.env.TVSHOW_RC_UPDATER_LAMBDA_NAME;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const tvShowRepo = new TvShowRepository(docClient);
const lambdaClient = new LambdaClient({});

export const handler = async (event: { tvShowId: string }): Promise<void> => {
  const tvShow = await tvShowRepo.getTvShowLazy(event.tvShowId);
  for (const s of tvShow.seasons) {
    const rcUpdaterParams = {
      tvShowId: event.tvShowId,
      seasonNumber: s.seasonNumber
    }
    const lambdaParams = {
      FunctionName: tvShowRCUpdaterLambdaName,
      InvocationType: InvocationType.Event,
      Payload: JSON.stringify(rcUpdaterParams)
    };
    const invokeCommand = new InvokeCommand(lambdaParams);
    try {
      await lambdaClient.send(invokeCommand);
    } catch (e) {
      console.log(e);
    }
  }
}
