import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { TvShowRepository } from '../../../adapters/TvShowRepository'

const marshallOptions = {
  convertClassInstanceToMap: true
}

const translateConfig = { marshallOptions }

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig)
const tvShowRepo = new TvShowRepository(docClient)

interface Param {
  tvShowId: string
  value: boolean
}

export const handler = async (event: Param): Promise<void> => {
  let tvShow = await tvShowRepo.getTvShowRoot(event.tvShowId);
  tvShow.useTvdb = event.value;
  await tvShowRepo.saveTvShow(tvShow);
}
