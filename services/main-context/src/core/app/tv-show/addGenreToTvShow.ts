import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TvShowGenre, TvShowGenres } from "../../domain/TvShowGenres";
import { TvShowRepositoryInterface } from "../../ports/TvShowRepositoryInterface";
import { TvShowRepository } from "../../../adapters/TvShowRepository";

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const tvShowRepo: TvShowRepositoryInterface = new TvShowRepository(docClient);

interface AddGenreParam {
  tvShowId: string;
  genre: keyof typeof TvShowGenres;
}

export const handler = async (event: AddGenreParam): Promise<void> => {
  let tvShow = await tvShowRepo.getTvShowById(event.tvShowId);
  tvShow.addGenre(new TvShowGenre(event.genre));
  await tvShowRepo.saveTvShow(tvShow);
};
