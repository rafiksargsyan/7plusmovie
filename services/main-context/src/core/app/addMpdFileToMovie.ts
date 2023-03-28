import { Movie } from "../domain/Movie";
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;

const docClient = DynamoDBDocument.from(new DynamoDB({}));

interface AddMpdFileParam {
  movieId: string;
  relativePath: string;
}

export const handler = async (event: AddMpdFileParam): Promise<void> => { 
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
  movie.addMpdFile(event.relativePath);
  await docClient.put({ TableName: dynamodbMovieTableName, Item: movie });
};

class FailedToGetMovieError extends Error {}
