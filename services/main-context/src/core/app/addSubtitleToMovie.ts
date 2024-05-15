import { Movie } from "../domain/Movie";
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { SubsLangCode } from "../domain/SubsLangCodes";
import { Subtitle } from "../domain/entity/Subtitle";
import { SubtitleType } from "../domain/SubtitleType";

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

interface AddSubtitleParam {
  movieId: string;
  lang: string;
  relativePath: string;
  type: string;
  name: string;
}

export const handler = async (event: AddSubtitleParam): Promise<void> => {
  const queryParams = {
    TableName: dynamodbMovieTableName,
    Key: { 'id': event.movieId }
  } as const;
  let data = await docClient.get(queryParams);
  if (data === undefined || data.Item === undefined) {
    throw new FailedToGetMovieError();
  }
  let movie = new Movie(true);
  Object.assign(movie, data.Item);
  movie.addSubtitle(event.name, new Subtitle(event.name, event.relativePath, new SubsLangCode(event.lang), new SubtitleType(event.type)));
  await docClient.put({ TableName: dynamodbMovieTableName, Item: movie });
};

class FailedToGetMovieError extends Error {}
