import { TvShow } from "../../domain/TvShow";
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

const dynamodbTvShowTableName = process.env.DYNAMODB_TV_SHOW_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

interface AddTmdbSeasonNumberParam {
  tvShowId: string;
  tmdbSeasonNumber: number;
  seasonNumber: number;
}

export const handler = async (event: AddTmdbSeasonNumberParam): Promise<void> => {
  const queryParams = {
    TableName: dynamodbTvShowTableName,
    Key: { 'id': event.tvShowId }
  } as const;
  let data = await docClient.get(queryParams);
  if (data === undefined || data.Item === undefined) {
    throw new FailedToGetTvShowError();
  }
  let tvShow = new TvShow(true);
  Object.assign(tvShow, data.Item);
  tvShow.addTmdbSeasonNumberToSeason(event.seasonNumber, event.tmdbSeasonNumber);
  await docClient.put({ TableName: dynamodbTvShowTableName, Item: tvShow });
};

class FailedToGetTvShowError extends Error {}