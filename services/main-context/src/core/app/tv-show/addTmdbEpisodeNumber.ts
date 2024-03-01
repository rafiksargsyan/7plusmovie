import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TvShowRepositoryInterface } from '../../ports/TvShowRepositoryInterface';
import { TvShowRepository } from '../../../adapters/TvShowRepository';

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const tvShowRepo: TvShowRepositoryInterface = new TvShowRepository(docClient);

interface AddTmdbEpisodeNumberParam {
  tvShowId?: string;
  tmdbEpisodeNumber?: number;
  seasonNumber?: number;
  episodeNumber?: number;
}

export const handler = async (event: AddTmdbEpisodeNumberParam): Promise<void> => {
  let tvShow = await tvShowRepo.getTvShowById(event.tvShowId)
  tvShow.addTmdbEpisodeNumber(event.seasonNumber, event.episodeNumber, event.tmdbEpisodeNumber);
  await tvShowRepo.saveTvShow(tvShow);
};
