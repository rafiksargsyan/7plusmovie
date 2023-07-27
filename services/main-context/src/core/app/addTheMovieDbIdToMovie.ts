import { Movie } from "../domain/Movie";
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

interface AddTmdbIdParam {
  movieId: string;
  tmdbId: string;
}

export const handler = async (event: AddTmdbIdParam): Promise<void> => {
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
  movie.setTheMovieDbId(event.tmdbId);
  await docClient.put({ TableName: dynamodbMovieTableName, Item: movie });
};

class FailedToGetMovieError extends Error {}
