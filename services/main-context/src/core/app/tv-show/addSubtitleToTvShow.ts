import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { SubsLangCode } from "../../domain/SubsLangCodes";
import { TvShowRepositoryInterface } from '../../ports/TvShowRepositoryInterface';
import { TvShowRepository } from '../../../adapters/TvShowRepository';

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const tvShowRepo: TvShowRepositoryInterface = new TvShowRepository(docClient);

interface AddSubtitleParam {
  tvShowId: string;
  lang: string;
  relativePath: string;
  season: number;
  episode: number;
}

export const handler = async (event: AddSubtitleParam): Promise<void> => {
  let tvShow = await tvShowRepo.getTvShowById(event.tvShowId) 
  tvShow.addSubtitle(event.season, event.episode, new SubsLangCode(event.lang), event.relativePath);
  await tvShowRepo.saveTvShow(tvShow);
};
