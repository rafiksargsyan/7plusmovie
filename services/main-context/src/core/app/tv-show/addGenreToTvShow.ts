import { TvShow } from "../../domain/TvShow";
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TvShowGenre, TvShowGenres } from "../../domain/TvShowGenres";

const dynamodbTvShowTableName = process.env.DYNAMODB_TV_SHOW_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

interface AddGenreParam {
  tvShowId: string;
  genre: keyof typeof TvShowGenres;
}

export const handler = async (event: AddGenreParam): Promise<void> => {
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
  tvShow.addGenre(new TvShowGenre(event.genre));
  await docClient.put({ TableName: dynamodbTvShowTableName, Item: tvShow });
};

class FailedToGetTvShowError extends Error {}
