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

interface AddTmdbIdParam {
  tvShowId: string;
  tmdbId: string;
}

export const handler = async (event: AddTmdbIdParam): Promise<void> => {
  let tvShow = await tvShowRepo.getTvShowById(event.tvShowId);
  tvShow.setTheMovieDbId(event.tmdbId);
  await tvShowRepo.saveTvShow(tvShow);
};
