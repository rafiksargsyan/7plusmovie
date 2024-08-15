import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TvShowRepository } from '../../adapters/TvShowRepository';
import { InvocationType, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { shuffleArray } from '../../utils';

const tvShowRCUpdaterLambdaName = process.env.TVSHOW_RC_UPDATER_LAMBDA_NAME;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const tvShowRepo = new TvShowRepository(docClient);
const lambdaClient = new LambdaClient({});

const ONE_YEAR_IN_MILLIS = 12 * 30 * 24 * 60 * 60 * 1000;
const ONE_DAY_IN_MILLIS = 24 * 60 * 60 * 1000;

export const handler = async (event: { tvShowId: string }): Promise<void> => {
  const tvShow = await tvShowRepo.getById(event.tvShowId);
  shuffleArray(tvShow.seasons)
  for (const s of tvShow.seasons) {
    tvShow.checkAndEmptyReleaseCandidates(s.seasonNumber, false);
    await tvShowRepo.save(tvShow, false, [s.seasonNumber], { [s.seasonNumber] : s.episodes.map(e => e.episodeNumber) });
    if (s.readyToBeProcessed) continue;
    let forceScan = false;
    let emptyEpisodeExists = false;
    for (const e of s.episodes) {
      forceScan = forceScan || e.forceScan
      emptyEpisodeExists = emptyEpisodeExists || (Object.keys(e.releases).length === 0)
    }
    if (!emptyEpisodeExists) {
      const estimatedLastEpisodeReleaseTime = tvShow.estimatedLastEpisodeReleaseTime(s.seasonNumber)
      if (estimatedLastEpisodeReleaseTime != null && (Date.now() - estimatedLastEpisodeReleaseTime > ONE_YEAR_IN_MILLIS) && !forceScan) {
        continue;
      }
      if (Date.now() - s.lastReleaseCandidateScanTimeMillis < ONE_DAY_IN_MILLIS) {
        continue;
      }
    }
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
    // Do one seasons per call to not overload sonarr
    return
  }
}
