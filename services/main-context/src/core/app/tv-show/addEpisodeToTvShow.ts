import { TvShow } from "../../domain/TvShow";
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { SubsLangCode } from "../../domain/SubsLangCodes";

const dynamodbTvShowTableName = process.env.DYNAMODB_TV_SHOW_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

interface AddEpisodeParam {
  tvShowId: string;
  originalName: string;
  seasonNumber: number;
  episodeNumber: number;
}

export const handler = async (event: AddEpisodeParam): Promise<void> => {
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
  tvShow.addEpisodeToSeason(event.seasonNumber, event.originalName, event.episodeNumber);
  await docClient.put({ TableName: dynamodbTvShowTableName, Item: tvShow });
};

class FailedToGetTvShowError extends Error {}