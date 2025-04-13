import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TvShowRepository } from "../../adapters/TvShowRepository";

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const tvShowRepo = new TvShowRepository(docClient);

interface SetUseTvdbParam {
  tvShowId: string  
  value: boolean
}

export const handler = async (event: SetUseTvdbParam): Promise<void> => {
  const tvShow = await tvShowRepo.getById(event.tvShowId);
  tvShow.useTvdb = event.value;
  await tvShowRepo.save(tvShow, true, [], {});
}
