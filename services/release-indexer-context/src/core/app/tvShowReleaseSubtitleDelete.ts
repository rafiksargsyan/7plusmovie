import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TvShowRepository } from '../../adapters/TvShowRepository';

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const tvShowRepo = new TvShowRepository(docClient);

interface Param {
  tvShowId: string;
  season: number;
  episode: number;
  releaseId: string;
  stream: number;
}

export const handler = async (event: Param): Promise<void> => {
  const tvShow = await tvShowRepo.getEpisode(event.tvShowId, event.season, event.episode);
  tvShow.deleteSub(event.season, event.episode, event.releaseId, event.stream);
  await tvShowRepo.save(tvShow, false, [event.season], { [event.season]: [event.episode] })
};
