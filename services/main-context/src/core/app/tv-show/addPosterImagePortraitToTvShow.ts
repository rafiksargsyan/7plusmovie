import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { L8nLangCode } from "../../domain/L8nLangCodes";
import { TvShowRepositoryInterface } from '../../ports/TvShowRepositoryInterface';
import { TvShowRepository } from '../../../adapters/TvShowRepository';

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const tvShowRepo: TvShowRepositoryInterface = new TvShowRepository(docClient);

interface AddPosterImagePortraitParam {
  tvShowId: string;
  locale: string;
  relativePath: string;
}

export const handler = async (event: AddPosterImagePortraitParam): Promise<void> => {
  let tvShow = await tvShowRepo.getTvShowById(event.tvShowId)
  tvShow.addPosterImagePortrait(new L8nLangCode(event.locale), event.relativePath);
  await tvShowRepo.saveTvShow(tvShow);
};
