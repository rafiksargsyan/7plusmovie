import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TvShowRepository } from "../../adapters/TvShowRepository";

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const tvShowRepo = new TvShowRepository(docClient);

interface AddTmdbIdParam {
  tvShowId: string;
  tmdbId: string;
}

export const handler = async (event: AddTmdbIdParam): Promise<void> => {
  const tvShow = await tvShowRepo.getById(event.tvShowId);
  if (tvShow.setTmdbId(event.tmdbId)) {
    await tvShowRepo.save(tvShow);
  }
}
