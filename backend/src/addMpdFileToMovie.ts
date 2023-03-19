import { Movie } from "./Movie";
import { DynamoDB } from 'aws-sdk';

const docClient = new DynamoDB.DocumentClient();

interface AddMpdFileParam {
  movieId: string;
  relativePath: string;
}

export const handler = async (event: AddMpdFileParam): Promise<void> => {
  const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;
  const queryParams = {
    TableName: dynamodbMovieTableName,
    Key: { 'id': event.movieId }
  } as const;
  let data = await docClient.get(queryParams).promise();
  if (data === undefined || data.Item === undefined) {
    throw new FailedToGetMovieError();
  }
  let movie = new Movie(true);
  Object.assign(movie, data.Item);  
  movie.addMpdFile(event.relativePath);
  await docClient.put({ TableName: dynamodbMovieTableName, Item: movie }).promise();
};

class FailedToGetMovieError extends Error {}
