import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TvShowRepository } from '../../adapters/TvShowRepository';
import { InvocationType, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

const tvShowReleaseDownloaderLambdaName = process.env.TVSHOW_RELEASE_DOWNLOADER_LAMBDA_NAME;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const tvShowRepo = new TvShowRepository(docClient);
const lambdaClient = new LambdaClient({});

export const handler = async (event: { tvShowId: string }): Promise<void> => {
  const tvShow = await tvShowRepo.getById(event.tvShowId);
  for (const s of tvShow.seasons) {
    if (!s.readyToBeProcessed) continue;
    for (const e of s.episodes) {
      await new Promise(r => setTimeout(r, 2000))
      const payload = {
        tvShowId: event.tvShowId,
        seasonNumber: s.seasonNumber,
        episodeNumber: e.episodeNumber
      }
      const lambdaParams = {
        FunctionName: tvShowReleaseDownloaderLambdaName,
        InvocationType: InvocationType.Event,
        Payload: JSON.stringify(payload)
      };
      const invokeCommand = new InvokeCommand(lambdaParams);
      try {
        await lambdaClient.send(invokeCommand);
      } catch (e) {
        console.log(e);
      }
    }
  }
}
