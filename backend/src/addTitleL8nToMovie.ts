import { Movie } from "./Movie";
import { DynamoDB } from 'aws-sdk';
import { L8nLangCode } from "./L8nLangCodes";

const docClient = new DynamoDB.DocumentClient();

interface AddTitleL8nParam {
  movieId: string;
  locale: string;
  title: string;
}

export const handler = async (event: AddTitleL8nParam): Promise<void> => {
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
  movie.addTitleL8n(new L8nLangCode(event.locale), event.title);
  await docClient.put({ TableName: dynamodbMovieTableName, Item: movie }).promise();
};

class FailedToGetMovieError extends Error {}
