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

interface AddTitleL8nParam {
  tvShowId: string;
  locale: string;
  title: string;
}

export const handler = async (event: AddTitleL8nParam): Promise<void> => {
  let tvShow = await tvShowRepo.getTvShowById(event.tvShowId); 
  tvShow.addTitleL8n(new L8nLangCode(event.locale), event.title);
  await tvShowRepo.saveTvShow(tvShow);
};
