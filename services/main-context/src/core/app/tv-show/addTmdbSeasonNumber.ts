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

interface AddTmdbSeasonNumberParam {
  tvShowId: string;
  tmdbSeasonNumber: number;
  seasonNumber: number;
}

export const handler = async (event: AddTmdbSeasonNumberParam): Promise<void> => {
  let tvShow = await tvShowRepo.getTvShowById(event.tvShowId);
  tvShow.addTmdbSeasonNumberToSeason(event.seasonNumber, event.tmdbSeasonNumber);
  await tvShowRepo.saveTvShow(tvShow);
};
