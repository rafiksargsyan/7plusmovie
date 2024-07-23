import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TvShowRepository } from "../../adapters/TvShowRepository";

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

const tvShowRepo = new TvShowRepository(docClient);

interface DeleteTvShowParam {
  tvShowId: string
}

export const handler = async (event: DeleteTvShowParam): Promise<void> => {
  await tvShowRepo.deleteById(event.tvShowId);
}