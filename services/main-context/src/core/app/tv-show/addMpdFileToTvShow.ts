import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
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

interface AddMpdFileParam {
  season: number;
  episode: number;
  tvShowId: string;
  relativePath: string;
}

export const handler = async (event: AddMpdFileParam): Promise<void> => { 
  let tvShow = await tvShowRepo.getTvShowById(event.tvShowId);
  tvShow.addMpdFile(event.season, event.episode, event.relativePath);
  await tvShowRepo.saveTvShow(tvShow);
};
